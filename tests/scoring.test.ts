import { describe, expect, it } from 'vitest';
import {
  evaluate,
  normalize,
  parseOutput,
  recommendation,
  summarize,
  weights,
} from '@/lib/scoring';
import { fixtures } from '@/lib/fixtures';
import type { CaseResult, GatewayMetadata, Objective, ScenarioId } from '@/lib/types';
const metadata = (latencyMs: number, costUsd: number | null) =>
  ({ latencyMs, costUsd, totalTokens: 10 }) as GatewayMetadata;
const result = (
  model: string,
  accuracy: number,
  latency: number,
  cost: number | null,
  valid = true,
): CaseResult => ({
  model,
  caseId: 'sup-01',
  evaluation: { accuracy, valid, passed: accuracy === 1 && valid, missing: 0, fields: [] },
  metadata: metadata(latency, cost),
});
describe('normalization and parsing', () => {
  it('normalizes Unicode, whitespace, and case', () =>
    expect(normalize('  ＰＩＮＥ\n  Grove ')).toBe('pine grove'));
  it('preserves numeric types and null', () => {
    expect(normalize(0)).toBe(0);
    expect(normalize(null)).toBe(null);
    expect(normalize('0')).not.toBe(normalize(0));
  });
  it('accepts one JSON fence', () =>
    expect(parseOutput('```json\n{"answer":16}\n```')).toEqual({ answer: 16 }));
  it('rejects prose instead of silently repairing', () =>
    expect(() => parseOutput('Answer: {"answer":16}')).toThrow());
});
describe('deterministic evaluation', () => {
  for (const scenario of Object.keys(fixtures) as ScenarioId[]) {
    it.each(fixtures[scenario])(`${scenario}: known expected output passes ($id)`, (fixture) => {
      expect(evaluate(scenario, fixture, JSON.stringify(fixture.expected))).toMatchObject({
        valid: true,
        passed: true,
        accuracy: 1,
        missing: 0,
      });
    });
  }
  it('scores partial extraction by field', () => {
    const fixture = fixtures.extraction[0];
    const output = { ...fixture.expected, currency: 'EUR' };
    expect(evaluate('extraction', fixture, JSON.stringify(output))).toMatchObject({
      valid: true,
      accuracy: 5 / 6,
      passed: false,
    });
  });
  it('distinguishes missing null from explicit null', () => {
    expect(evaluate('reasoning', fixtures.reasoning[2], '{}')).toMatchObject({
      valid: false,
      accuracy: 0,
      missing: 1,
    });
    expect(evaluate('reasoning', fixtures.reasoning[2], '{"answer":null}').passed).toBe(true);
  });
  it('rejects numeric strings in invoice schema', () =>
    expect(
      evaluate(
        'extraction',
        fixtures.extraction[2],
        JSON.stringify({ ...fixtures.extraction[2].expected, amount: '0' }),
      ),
    ).toMatchObject({ valid: false, accuracy: 5 / 6 }));
  it('rejects additional fields', () =>
    expect(
      evaluate('classification', fixtures.classification[0], '{"category":"billing","extra":1}'),
    ).toMatchObject({ valid: false, accuracy: 1, passed: false }));
  it('rejects an invalid classification category', () =>
    expect(
      evaluate('classification', fixtures.classification[0], '{"category":"urgent"}'),
    ).toMatchObject({ valid: false, accuracy: 0 }));
  it('records invalid JSON with all fields missing', () =>
    expect(evaluate('extraction', fixtures.extraction[0], 'broken')).toMatchObject({
      valid: false,
      accuracy: 0,
      missing: 6,
    }));
  it('zero amount is a real matched value', () =>
    expect(
      evaluate(
        'extraction',
        fixtures.extraction[2],
        JSON.stringify(fixtures.extraction[2].expected),
      ).fields.find((f) => f.field === 'amount')?.match,
    ).toBe(true));
});
describe('recommendation', () => {
  it('prefers accuracy under the quality objective', () => {
    const rows = summarize(
      ['a', 'b'],
      [result('a', 1, 1000, 0.01), result('b', 0.5, 10, 0.0001)],
      'quality',
    );
    expect(rows[0].model).toBe('a');
  });
  it('prefers speed under the speed objective with comparable quality', () => {
    const rows = summarize(
      ['a', 'b'],
      [result('a', 1, 1000, 0.01), result('b', 0.9, 10, 0.01)],
      'speed',
    );
    expect(rows[0].model).toBe('b');
  });
  it('explains accuracy and complete reported cost tradeoffs', () => {
    const rows = summarize(
      ['fast', 'accurate'],
      [result('fast', 0.8, 10, 0.0001), result('accurate', 1, 100, 0.01)],
      'speed',
    );
    const decision = recommendation(rows);
    expect(decision?.winner.model).toBe('fast');
    expect(decision?.moreAccurate.map((row) => row.model)).toEqual(['accurate']);
    expect(decision?.moreExpensive.map((row) => row.model)).toEqual(['accurate']);
    expect(
      recommendation([
        { ...rows[0], score: 0 },
        { ...rows[1], score: 0 },
      ]),
    ).toBeUndefined();
  });
  it('never rewards missing costs as free', () => {
    const rows = summarize(
      ['a', 'b'],
      [result('a', 1, 10, null), result('b', 1, 10, 0.01)],
      'cost',
    );
    expect(rows[0].score).toBe(rows[1].score);
    expect(rows.every((r) => r.weights[3] === 0)).toBe(true);
    expect(rows.find((r) => r.model === 'a')?.costUsd).toBeNull();
  });
  it('handles zero costs and latencies without NaN', () => {
    const rows = summarize(['a', 'b'], [result('a', 1, 0, 0), result('b', 1, 1, 0.01)], 'balanced');
    expect(rows.every((r) => Number.isFinite(r.score))).toBe(true);
    expect(rows[0].model).toBe('a');
  });
  it('includes skipped and failed cases in denominators', () => {
    const rows = summarize(
      ['a'],
      [
        result('a', 1, 10, 0.01),
        { model: 'a', caseId: '2', skipped: true },
        {
          model: 'a',
          caseId: '3',
          error: {
            code: 'timeout',
            message: 'timeout',
            status: 504,
            retryAfter: null,
            requestId: null,
          },
        },
      ],
      'balanced',
    );
    expect(rows[0]).toMatchObject({
      accuracy: 1 / 3,
      passRate: 1 / 3,
      skipped: 1,
      failures: 1,
      failureRate: 2 / 3,
      costUsd: null,
    });
  });
  it('does not recommend all-failed runs', () => {
    expect(
      summarize(['a'], [{ model: 'a', caseId: 'x', skipped: true }], 'balanced')[0].score,
    ).toBe(0);
  });
  it.each(Object.keys(weights) as Objective[])('%s weights sum to 1', (objective) =>
    expect(weights[objective].reduce((a, b) => a + b)).toBeCloseTo(1),
  );
});
