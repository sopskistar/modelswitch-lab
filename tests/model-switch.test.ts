import { describe, expect, it } from 'vitest';
import {
  isSwitchableModel,
  switchRecommendation,
  switchResultStatus,
  switchableModels,
} from '@/lib/model-switch';
import type { CaseResult } from '@/lib/types';

const models = [{ id: 'qwen' }, { id: 'llama' }, { id: 'unapproved' }];
const roles = { evaluator: 'qwen', analyst: 'llama' };
const passed = (
  model: string,
  accuracy: number,
  latencyMs: number,
  costUsd: number,
): CaseResult => ({
  model,
  caseId: 'inv-01',
  evaluation: { valid: true, accuracy, passed: accuracy === 1, missing: 0, fields: [] },
  metadata: {
    requestId: `${model}-request`,
    responseId: null,
    requestedModel: model,
    responseModel: model,
    effectiveModel: model,
    provider: 'hosted',
    attempts: 1,
    fallback: false,
    gatewayDurationMs: latencyMs,
    latencyMs,
    promptTokens: 1,
    completionTokens: 1,
    totalTokens: 2,
    costUsd,
    pricingSource: 'deployment',
    toolCalls: [],
    guardrails: null,
    headers: {},
  },
});

describe('Model Switch', () => {
  it('only exposes distinct configured role models found in the Otari catalog', () => {
    expect(switchableModels(models, roles).map((model) => model.id)).toEqual(['qwen', 'llama']);
    expect(isSwitchableModel('llama', models, roles)).toBe(true);
    expect(isSwitchableModel('unapproved', models, roles)).toBe(false);
  });

  it('switching back to the evaluator remains permitted without an inference side effect', () => {
    expect(isSwitchableModel('qwen', models, roles)).toBe(true);
  });

  it('recommends only from valid equivalent-fixture data using accuracy then latency and cost', () => {
    const qwen = passed('qwen', 5 / 6, 900, 0.0002);
    const llama = passed('llama', 1, 1300, 0.0001);
    expect(switchRecommendation([qwen, llama])?.model).toBe('llama');
    expect(switchRecommendation([qwen])?.model).toBe('qwen');
    expect(
      switchRecommendation([{ ...llama, evaluation: { ...llama.evaluation!, valid: false } }]),
    ).toBeUndefined();
  });

  it('uses latency, then known reported cost, to break equal-accuracy ties', () => {
    expect(
      switchRecommendation([passed('llama', 1, 1500, 0.0001), passed('qwen', 1, 800, 0.0005)])
        ?.model,
    ).toBe('qwen');
    expect(
      switchRecommendation([passed('llama', 1, 800, 0.0001), passed('qwen', 1, 800, 0.0005)])
        ?.model,
    ).toBe('llama');
  });

  it('distinguishes model output failure from gateway failure and gateway budget refusal', () => {
    expect(switchResultStatus(passed('qwen', 0.5, 1, 0))).toBe('Incorrect answer');
    expect(
      switchResultStatus({
        model: 'qwen',
        caseId: 'inv-01',
        error: {
          code: 'budget_exceeded',
          message: 'Budget',
          status: 403,
          retryAfter: null,
          requestId: 'id',
        },
      }),
    ).toBe('Otari budget refused the request');
    expect(
      switchResultStatus({
        model: 'qwen',
        caseId: 'inv-01',
        error: {
          code: 'timeout',
          message: 'Timeout',
          status: 504,
          retryAfter: null,
          requestId: null,
        },
      }),
    ).toBe('Request timed out or was interrupted');
  });
});
