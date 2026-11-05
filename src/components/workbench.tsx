'use client';
/* eslint-disable react-hooks/set-state-in-effect -- URL and browser storage are external state restored after server rendering. */
import { useEffect, useRef, useState } from 'react';
import { fixtures, scenarios } from '@/lib/fixtures';
import { recommendation, summarize, weights } from '@/lib/scoring';
import { exportCsv, exportJson } from '@/lib/export';
import { capabilities, advancedVerifiedPoints, mcpVerified } from '@/lib/capabilities';
import { sources } from '@/lib/security';
import {
  isSwitchableModel,
  switchRecommendation,
  switchResultStatus,
  switchableModels,
} from '@/lib/model-switch';
import type { Capability } from '@/lib/capabilities';
import type {
  CaseResult,
  Completion,
  Model,
  Objective,
  Run,
  SafeError,
  ScenarioId,
  Tool,
  TraceEvent,
} from '@/lib/types';
import { Mark } from './mark';

type View = 'workspace' | 'model-switch' | 'results' | 'trace' | 'capabilities' | 'guide';
interface Catalog {
  configured: boolean;
  demoEnabled: boolean;
  region: string;
  roles: { evaluator: string; analyst: string; policy: string };
  models: Model[];
  tools: Tool[];
  catalogCount?: number;
  checkedAt?: string;
  error?: { code: string; message: string };
}
interface SwitchTestRecord {
  at: string;
  runId: string;
  result: CaseResult;
}
const views: View[] = ['workspace', 'model-switch', 'results', 'trace', 'capabilities', 'guide'];
const names: Record<View, string> = {
  workspace: 'Workspace',
  'model-switch': 'Model switch',
  results: 'Results',
  trace: 'Request trace',
  capabilities: 'Otari capabilities',
  guide: 'Guide',
};
const money = (n: number | null | undefined) => (n == null ? 'Not reported' : `$${n.toFixed(6)}`);
const percent = (n: number) => `${(n * 100).toFixed(0)}%`;
const duration = (n: number | null | undefined) =>
  n == null ? 'Not reported' : n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`;
const timestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
const shortModel = (id: string) => id.split('/').pop() || id;
const fallbackError = (message: string): SafeError => ({
  code: 'network_interrupted',
  message,
  status: 0,
  retryAfter: null,
  requestId: null,
});
const interruptedError = (error: unknown): SafeError => {
  if (error instanceof DOMException && error.name === 'TimeoutError')
    return {
      code: 'browser_wait_timeout',
      message:
        'The browser stopped waiting for the application. The server or gateway may still be processing; check the trace or Otari usage before retrying.',
      status: 0,
      retryAfter: null,
      requestId: null,
    };
  return fallbackError(
    'The browser connection was interrupted. The request outcome is unknown; inspect the trace and Otari usage before retrying.',
  );
};
function Json({ value }: { value: unknown }) {
  return <pre className="json">{JSON.stringify(value, null, 2)}</pre>;
}
function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function Workbench() {
  const [view, setView] = useState<View>('workspace');
  const [scenario, setScenario] = useState<ScenarioId>('extraction');
  const [objective, setObjective] = useState<Objective>('balanced');
  const [count, setCount] = useState(3);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [activeModel, setActiveModel] = useState('');
  const [switchTests, setSwitchTests] = useState<SwitchTestRecord[]>([]);
  const [switchBusy, setSwitchBusy] = useState(false);
  const [switchError, setSwitchError] = useState<SafeError | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [notice, setNotice] = useState('');
  const [theme, setTheme] = useState('light');
  const [experiment, setExperiment] = useState<{
    id: string;
    data: Record<string, unknown>;
  } | null>(null);
  const [experimentBusy, setExperimentBusy] = useState('');
  const [source, setSource] = useState<'manifesto' | 'otari'>('manifesto');
  const [storageReady, setStorageReady] = useState(false);
  const stop = useRef(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const navigating = useRef(false);
  function navigate(next: View) {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set('view', next);
    history.pushState({}, '', url);
    navigating.current = true;
  }
  function viewAnchor(next: View, children: React.ReactNode, className?: string, label?: string) {
    return (
      <a
        href={`/app?view=${next}`}
        className={className}
        aria-label={label}
        onClick={(event) => {
          event.preventDefault();
          navigate(next);
        }}
      >
        {children}
      </a>
    );
  }
  async function loadCatalog() {
    setCatalogError('');
    setCatalog(null);
    try {
      const response = await fetch('/api/catalog');
      if (!response.ok) throw new Error();
      const data: Catalog = await response.json();
      setCatalog(data);
      setSelected(
        data.models.some((m) => m.id === data.roles.evaluator) ? [data.roles.evaluator] : [],
      );
      const permitted = switchableModels(data.models, data.roles);
      let saved = '';
      try {
        saved = localStorage.getItem('msl-active-model') || '';
      } catch {}
      const initial = isSwitchableModel(saved, data.models, data.roles)
        ? saved
        : permitted[0]?.id || '';
      setActiveModel(initial);
    } catch {
      setCatalogError('Could not reach the server. Check your connection, then refresh discovery.');
    }
  }
  useEffect(() => {
    const url = new URL(window.location.href),
      v = url.searchParams.get('view') as View;
    if (views.includes(v)) setView(v);
    const s = url.searchParams.get('scenario') as ScenarioId;
    if (s && s in scenarios) setScenario(s);
    const obj = url.searchParams.get('objective') as Objective;
    if (obj && obj in weights) setObjective(obj);
    try {
      const saved = localStorage.getItem('msl-recent');
      if (saved) {
        const parsed = JSON.parse(saved) as Run;
        if (parsed.version === 1 && Array.isArray(parsed.cases) && Array.isArray(parsed.trace)) {
          if (parsed.state === 'running') {
            parsed.state = 'interrupted';
            parsed.trace.push({
              at: new Date().toISOString(),
              source: 'application',
              label: 'Browser session interrupted',
              detail:
                'Completed cases were restored. A request interrupted during reload may still have incurred usage. Start a new run to repeat.',
            });
          }
          setRun(parsed);
        }
      }
      const switchSaved = localStorage.getItem('msl-switch-tests');
      if (switchSaved) {
        const parsed = JSON.parse(switchSaved) as SwitchTestRecord[];
        if (
          Array.isArray(parsed) &&
          parsed.length <= 8 &&
          parsed.every((item) => typeof item.at === 'string' && item.result?.model)
        )
          setSwitchTests(parsed);
      }
    } catch {
      setNotice('Recent results could not be restored. Browser storage may be unavailable.');
    }
    setStorageReady(true);
    setTheme(document.documentElement.dataset.mode || 'light');
    void loadCatalog();
    const pop = () => {
      const next = new URL(location.href).searchParams.get('view') as View;
      setView(views.includes(next) ? next : 'workspace');
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    if (storageReady && run) {
      try {
        localStorage.setItem('msl-recent', JSON.stringify(run));
      } catch {
        setNotice('Browser storage is full or unavailable. Export results before leaving.');
      }
    }
  }, [run, storageReady]);
  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem('msl-switch-tests', JSON.stringify(switchTests));
    } catch {
      setNotice('Model switch history could not be saved. Export any results you need to keep.');
    }
  }, [switchTests, storageReady]);
  useEffect(() => {
    if (navigating.current) {
      resultHeading.current?.focus();
      navigating.current = false;
    }
  }, [view]);
  function setFilter(nextScenario: ScenarioId, nextObjective = objective) {
    setScenario(nextScenario);
    setObjective(nextObjective);
    const url = new URL(location.href);
    url.searchParams.set('scenario', nextScenario);
    url.searchParams.set('objective', nextObjective);
    history.replaceState({}, '', url);
  }
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.mode = next;
    try {
      localStorage.setItem('msl-theme', next);
    } catch {}
  }
  async function post(body: unknown) {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(29000),
    });
    let data: { error?: SafeError; [key: string]: unknown };
    try {
      data = await response.json();
    } catch {
      const gatewayTimeout = response.status === 504;
      data = {
        error: {
          code: gatewayTimeout ? 'function_timeout' : 'endpoint_error',
          message: gatewayTimeout
            ? 'The application endpoint returned HTTP 504 without an Otari response. The gateway outcome and billing are unknown; inspect Otari usage before retrying.'
            : `The application endpoint returned HTTP ${response.status} without a readable result. The gateway outcome may be unknown.`,
          status: response.status,
          retryAfter: null,
          requestId: null,
        },
      };
    }
    return { response, data };
  }
  async function startRun() {
    if (!catalog || !selected.length) return;
    setBusy(true);
    stop.current = false;
    setNotice('');
    const next: Run = {
      version: 1,
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      scenario,
      objective,
      models: [...selected],
      caseCount: count,
      cases: [],
      trace: [],
      summaries: [],
      state: 'running',
    };
    const receipts: string[] = [];
    const add = (source: TraceEvent['source'], label: string, detail: unknown) =>
      next.trace.push({ at: new Date().toISOString(), source, label, detail });
    const publish = () => {
      next.summaries = summarize(next.models, next.cases, objective);
      setRun(structuredClone(next));
    };
    add('application', 'Benchmark started', {
      scenario,
      models: selected,
      caseCount: count,
      objective,
      fixtureVersion: 1,
    });
    publish();
    navigate('results');
    let blocked: SafeError | undefined;
    for (const model of selected) {
      for (const fixture of fixtures[scenario].slice(0, count)) {
        if (stop.current || blocked) {
          const result: CaseResult = { model, caseId: fixture.id, skipped: true };
          next.cases.push(result);
          add('application', 'Case skipped', {
            model,
            caseId: fixture.id,
            reason: blocked?.code ?? 'Stopped by visitor',
          });
          publish();
          continue;
        }
        setProgress(`${shortModel(model)}: ${fixture.title}`);
        add('application', 'Otari request started', {
          role: 'evaluator',
          requestedModel: model,
          caseId: fixture.id,
        });
        publish();
        try {
          const { response, data } = await post({
            action: 'case',
            scenario,
            caseId: fixture.id,
            model,
            runId: next.id,
          });
          if (!response.ok || !data.result) {
            const error = data.error ?? fallbackError('The server could not finish this case.');
            next.cases.push({ model, caseId: fixture.id, error });
            add('application', 'Request refused before case completion', error);
            blocked = error;
            publish();
            continue;
          }
          const result = data.result as CaseResult;
          next.cases.push(result);
          if (typeof data.receipt === 'string') receipts.push(data.receipt);
          if (result.metadata)
            add('gateway', result.error ? 'Gateway refusal' : 'Gateway response', {
              caseId: fixture.id,
              role: 'evaluator',
              ...result.metadata,
            });
          if (result.error) {
            add('application', 'Case failed', result.error);
            if (
              [
                'insufficient_credit',
                'budget_exceeded',
                'authentication',
                'wrong_region',
                'rate_limit',
                'configuration_required',
              ].includes(result.error.code)
            )
              blocked = result.error;
          }
          if (result.evaluation)
            add('application', 'Deterministic scoring', {
              caseId: fixture.id,
              ...result.evaluation,
            });
        } catch (cause) {
          const error = interruptedError(cause);
          next.cases.push({ model, caseId: fixture.id, error });
          add('application', 'Response interrupted', error);
          blocked = error;
        }
        publish();
      }
    }
    if (!stop.current && !blocked && next.cases.some((c) => c.evaluation?.valid)) {
      setProgress('Analyst is interpreting verified metrics…');
      add('application', 'Analyst request started', {
        role: 'analyst',
        model: catalog.roles.analyst,
        receipts: receipts.length,
      });
      publish();
      try {
        const { response, data } = await post({
          action: 'analyst',
          runId: next.id,
          receipts,
          objective,
        });
        if (response.ok && data.analyst) {
          next.analyst = data.analyst as Completion;
          add('gateway', 'Analyst response', next.analyst.metadata);
        } else {
          next.analystError = data.error;
          add('application', 'Analyst unavailable', data.error);
        }
      } catch {
        next.analystError = fallbackError(
          'The analyst response was interrupted. Deterministic scores are retained.',
        );
        add('application', 'Analyst response interrupted', next.analystError);
      }
    }
    next.state = stop.current || blocked ? 'interrupted' : 'complete';
    add('application', 'Benchmark finished', {
      state: next.state,
      completed: next.cases.filter((c) => c.evaluation).length,
      failed: next.cases.filter((c) => c.error).length,
      skipped: next.cases.filter((c) => c.skipped).length,
    });
    publish();
    setBusy(false);
    setProgress('');
  }
  async function runExperiment(id: string) {
    setExperimentBusy(id);
    setExperiment(null);
    try {
      const { data } = await post({
        action: id,
        runId: crypto.randomUUID(),
        ...(id === 'web' ? { source } : {}),
      });
      setExperiment({ id, data });
    } catch {
      setExperiment({
        id,
        data: {
          error: { message: 'The browser lost the response. Inspect Otari before retrying.' },
          verified: false,
        },
      });
    } finally {
      setExperimentBusy('');
    }
  }
  function chooseActiveModel(modelId: string) {
    if (!catalog || !isSwitchableModel(modelId, catalog.models, catalog.roles)) return;
    setActiveModel(modelId);
    try {
      localStorage.setItem('msl-active-model', modelId);
    } catch {
      setNotice('The active model changed for this page, but browser storage is unavailable.');
    }
  }
  async function testActiveModel() {
    if (
      !catalog ||
      !catalog.demoEnabled ||
      !isSwitchableModel(activeModel, catalog.models, catalog.roles)
    )
      return;
    setSwitchBusy(true);
    setSwitchError(null);
    const runId = crypto.randomUUID();
    try {
      const { response, data } = await post({
        action: 'case',
        scenario: 'extraction',
        caseId: fixtures.extraction[0].id,
        model: activeModel,
        runId,
      });
      if (!response.ok || !data.result) {
        setSwitchError(data.error ?? fallbackError('The active-model request was refused.'));
        return;
      }
      const record: SwitchTestRecord = {
        at: new Date().toISOString(),
        runId,
        result: data.result as CaseResult,
      };
      setSwitchTests((current) => [record, ...current].slice(0, 8));
    } catch (cause) {
      setSwitchError(interruptedError(cause));
    } finally {
      setSwitchBusy(false);
    }
  }
  const mcpCompletion = experiment?.data.completion as
    { metadata?: { requestId?: string | null } } | undefined;
  const mcpEvidence =
    experiment?.id === 'mcp' &&
    experiment.data.verified === true &&
    typeof mcpCompletion?.metadata?.requestId === 'string'
      ? experiment.data
      : undefined;
  const caps = capabilities(catalog?.tools, mcpEvidence);
  const liveAdvancedPoints = advancedVerifiedPoints + (mcpEvidence && !mcpVerified ? 10 : 0);
  const ready = Boolean(
    catalog?.configured && catalog.demoEnabled && !catalog.error && selected.length,
  );
  const error = run?.cases.find((c) => c.error)?.error;
  const decision = run ? recommendation(run.summaries) : undefined;
  const recommend = decision?.winner;
  const availableSwitchModels = catalog ? switchableModels(catalog.models, catalog.roles) : [];
  const latestSwitchTestByModel = new Map<string, SwitchTestRecord>();
  for (const item of switchTests) {
    if (!latestSwitchTestByModel.has(item.result.model))
      latestSwitchTestByModel.set(item.result.model, item);
  }
  const switchDecision = switchRecommendation(switchTests.map((item) => item.result));
  const activeLastResult = activeModel
    ? latestSwitchTestByModel.get(activeModel)?.result
    : undefined;
  const routeCompletion =
    experiment?.id === 'routing'
      ? (experiment.data.completion as Completion | undefined)
      : undefined;
  const routeMetadata = routeCompletion?.metadata;
  const reportedCostsComplete =
    !!run &&
    run.summaries.every((row) => row.costUsd !== null) &&
    (run.analyst ? run.analyst.metadata.costUsd !== null : !run.analystError);
  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <header className="topbar">
        <div className="shell topbar-inner">
          {viewAnchor(
            'workspace',
            <>
              <Mark />
              <span>
                ModelSwitch <span className="brand-lab">Lab</span>
              </span>
            </>,
            'brand',
            'ModelSwitch Lab workspace',
          )}
          <div className="top-actions">
            <a
              href="https://github.com/sopskistar/modelswitch-lab"
              target="_blank"
              rel="noreferrer"
              className="quiet-link"
            >
              Source
            </a>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? (
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11Z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>
      <div className="nav-wrap">
        <nav className="shell nav" aria-label="Workbench views">
          {views.map((v) => (
            <a
              href={`?view=${v}`}
              key={v}
              aria-current={view === v ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate(v);
              }}
            >
              {names[v]}
            </a>
          ))}
        </nav>
      </div>
      <main id="main" className="shell main">
        <div className="page-head">
          <div>
            <h1 tabIndex={-1} ref={resultHeading}>
              {view === 'workspace' ? 'Put a model to the test.' : names[view]}
            </h1>
            <p>
              {view === 'workspace'
                ? 'Known answers. Measured performance. Inspectable evidence.'
                : view === 'results'
                  ? 'Every score starts with a verifiable answer.'
                  : view === 'trace'
                    ? 'Follow each request from task to interpretation.'
                    : view === 'model-switch'
                      ? 'Change the model used by your next real test request.'
                      : view === 'capabilities'
                        ? 'What the hosted gateway actually proved.'
                        : 'A short path from benchmark to evidence.'}
            </p>
          </div>
          <span className="gateway-label">Hosted Otari{catalog ? ` / ${catalog.region}` : ''}</span>
        </div>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {view === 'workspace' && (
          <>
            {!catalog && !catalogError && (
              <div className="connection skeleton" role="status">
                Discovering hosted models and tools…
              </div>
            )}
            {catalogError && (
              <div className="connection error" role="alert">
                <p>{catalogError}</p>
                <button className="button quiet" type="button" onClick={loadCatalog}>
                  Refresh discovery
                </button>
              </div>
            )}
            {catalog?.error && (
              <div className="connection error" role="alert">
                <strong>
                  {catalog.error.code === 'configuration_required'
                    ? 'Connect hosted Otari'
                    : 'Otari needs attention'}
                </strong>
                <p>{catalog.error.message}</p>
                <button className="button quiet" type="button" onClick={() => navigate('guide')}>
                  Open setup guide
                </button>
              </div>
            )}
            {catalog && !catalog.error && !catalog.demoEnabled && (
              <div className="connection" role="status">
                <strong>Public inference is disabled.</strong>
                <p>
                  Enable the capped demo in server configuration. You can inspect the synthetic
                  cases below.
                </p>
              </div>
            )}
            <div className="workbench-grid">
              <section className="configuration" aria-label="Benchmark configuration">
                <fieldset className="scenario-options">
                  <legend>Scenario</legend>
                  {(Object.keys(scenarios) as ScenarioId[]).map((s, i) => (
                    <label
                      className={`scenario-option ${scenario === s ? 'selected' : ''}`}
                      key={s}
                    >
                      <input
                        name="scenario"
                        type="radio"
                        value={s}
                        checked={scenario === s}
                        disabled={!storageReady || busy}
                        onChange={() => setFilter(s)}
                      />
                      <span className="scenario-index" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>
                        <strong>{scenarios[s].name}</strong>
                        <span className="subtle">{scenarios[s].description}</span>
                      </span>
                      <span className="radio-mark" aria-hidden="true" />
                    </label>
                  ))}
                </fieldset>
                <fieldset className="model-options">
                  <legend>Models to evaluate</legend>
                  {catalog?.models
                    .filter((m) => [catalog.roles.evaluator, catalog.roles.analyst].includes(m.id))
                    .map((m) => (
                      <label className="model-option" key={m.id}>
                        <input
                          type="checkbox"
                          name="models"
                          checked={selected.includes(m.id)}
                          onChange={(e) =>
                            setSelected((current) =>
                              e.target.checked
                                ? [...current, m.id]
                                : current.filter((id) => id !== m.id),
                            )
                          }
                          disabled={!storageReady || busy}
                        />
                        <span>
                          <strong>{m.name || shortModel(m.id)}</strong>
                          <code>{m.id}</code>
                        </span>
                      </label>
                    ))}
                  {(!catalog || !catalog.models.length) && (
                    <p className="subtle">Models appear after hosted discovery.</p>
                  )}
                </fieldset>
                <div className="settings-row">
                  <label>
                    Test cases
                    <select
                      name="count"
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      disabled={!storageReady || busy}
                    >
                      {[1, 3, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'case' : 'cases'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Optimize for
                    <select
                      name="objective"
                      value={objective}
                      onChange={(e) => setFilter(scenario, e.target.value as Objective)}
                      disabled={!storageReady || busy}
                    >
                      <option value="balanced">Balance</option>
                      <option value="quality">Accuracy</option>
                      <option value="speed">Speed</option>
                      <option value="cost">Cost</option>
                    </select>
                  </label>
                </div>
                <button
                  className="button primary run-button"
                  type="button"
                  disabled={!ready || busy}
                  onClick={startRun}
                >
                  {busy ? 'Benchmark running…' : 'Run benchmark'}
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
                <p className="micro">
                  At most {selected.length * count + 1} requests. No automatic retries.
                </p>
              </section>
              <section className="fixture-preview" aria-labelledby="cases-heading">
                <div className="section-head">
                  <h2 id="cases-heading">Test cases</h2>
                  <span className="subtle">Synthetic / v1</span>
                </div>
                <div className="case-ledger">
                  {fixtures[scenario].slice(0, count).map((f, i) => (
                    <details key={f.id} open={i === 0}>
                      <summary>
                        <span className="case-id">{f.id}</span>
                        <span>{f.title}</span>
                        <span className="disclosure" aria-hidden="true">
                          +
                        </span>
                      </summary>
                      <div className="fixture-body">
                        <p>{f.input}</p>
                        <h3>Expected output</h3>
                        <Json value={f.expected} />
                      </div>
                    </details>
                  ))}
                </div>
                <div className="method-note">
                  <h3>How this is measured</h3>
                  <p>
                    Normalized exact field matches. Strict JSON schema. Missing fields lose credit.
                  </p>
                  <button className="text-button" type="button" onClick={() => navigate('guide')}>
                    View scoring method
                  </button>
                </div>
              </section>
            </div>
            <div className="workspace-foot">
              <span>Evaluator executes the task. Analyst interprets verified metrics.</span>
              <span>Recent run stays in this browser.</span>
            </div>
          </>
        )}
        {view === 'model-switch' && (
          <>
            {!catalog && !catalogError && (
              <div className="connection skeleton" role="status">
                Discovering permitted models through Otari…
              </div>
            )}
            {catalogError && (
              <div className="connection error" role="alert">
                <p>{catalogError}</p>
                <button className="button quiet" type="button" onClick={loadCatalog}>
                  Refresh discovery
                </button>
              </div>
            )}
            {catalog && !catalog.demoEnabled && (
              <div className="connection" role="status">
                <strong>Inference is disabled.</strong>
                <p>
                  The model selection remains available. Enable the capped server demo before
                  sending requests.
                </p>
              </div>
            )}
            <div className="model-switch-layout">
              <section className="model-switch-column" aria-labelledby="active-model-heading">
                <div className="section-head">
                  <h2 id="active-model-heading">Active test model</h2>
                  <span className="subtle">This browser</span>
                </div>
                {activeModel ? (
                  <>
                    <p>
                      <strong>
                        {catalog?.models.find((model) => model.id === activeModel)?.name ||
                          shortModel(activeModel)}
                      </strong>
                    </p>
                    <code>{activeModel}</code>
                    <p className="micro">Selection type: model ID / manual</p>
                    <p className="micro">
                      Last request status:{' '}
                      {activeLastResult ? switchResultStatus(activeLastResult) : 'Not tested yet'}
                    </p>
                    {activeLastResult?.metadata && (
                      <p className="micro">
                        Serving model:{' '}
                        <code>{activeLastResult.metadata.effectiveModel || 'Not reported'}</code>
                        {' / '}provider:{' '}
                        <code>{activeLastResult.metadata.provider || 'Not reported'}</code>
                        {' / '}latency: {duration(activeLastResult.metadata.latencyMs)}
                        {' / '}reported cost: {money(activeLastResult.metadata.costUsd)}
                        {' / '}request:{' '}
                        <code>{activeLastResult.metadata.requestId || 'Not reported'}</code>
                      </p>
                    )}
                    <p className="micro">
                      Last successful response:{' '}
                      {activeLastResult?.output ? 'available below' : 'none recorded'}.
                    </p>
                    <p className="micro">
                      This selection changes future ModelSwitch test requests only. It does not
                      change your external application or Otari policy.
                    </p>
                  </>
                ) : (
                  <p className="subtle">No permitted evaluator model is available yet.</p>
                )}
                <div className="model-choice-list" aria-label="Available models">
                  {availableSwitchModels.map((model) => {
                    const last = latestSwitchTestByModel.get(model.id)?.result;
                    return (
                      <div className="model-choice" key={model.id}>
                        <div>
                          <strong>{model.name || shortModel(model.id)}</strong>
                          <code>{model.id}</code>
                          {model.pricing && (
                            <span className="subtle">
                              Catalog price per 1M tokens: input{' '}
                              {money(model.pricing.input_price_per_million)}, output{' '}
                              {money(model.pricing.output_price_per_million)}
                            </span>
                          )}
                          {last?.metadata?.provider ? (
                            <span className="subtle">
                              Last serving provider: {last.metadata.provider}
                            </span>
                          ) : (
                            <span className="subtle">No test response observed yet</span>
                          )}
                        </div>
                        {activeModel === model.id ? (
                          <span className="model-active">Active</span>
                        ) : (
                          <button
                            className="button quiet"
                            type="button"
                            disabled={!storageReady || switchBusy}
                            onClick={() => chooseActiveModel(model.id)}
                          >
                            Switch to {shortModel(model.id)}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="micro">
                  Only the configured evaluator and analyst IDs that also appear in the current
                  Otari catalog are permitted. Switching does not send a request.
                </p>
              </section>
              <section className="model-switch-column" aria-labelledby="model-test-heading">
                <div className="section-head">
                  <h2 id="model-test-heading">Test the same task</h2>
                  <span className="subtle">Synthetic fixture / inv-01</span>
                </div>
                <div className="switch-console">
                  <p>{fixtures.extraction[0].input}</p>
                  <p>
                    Expected: six invoice fields. Output is checked with the benchmark’s
                    deterministic schema and field scorer.
                  </p>
                  <button
                    className="button primary"
                    type="button"
                    disabled={!storageReady || !catalog?.demoEnabled || !activeModel || switchBusy}
                    onClick={testActiveModel}
                  >
                    {switchBusy
                      ? 'Testing active model…'
                      : `Test ${shortModel(activeModel || 'active model')}`}
                  </button>
                </div>
                {switchError && (
                  <div className="connection error" role="alert">
                    <strong>{switchError.code}</strong>
                    <p>{switchError.message}</p>
                    {switchError.requestId && <code>Request {switchError.requestId}</code>}
                  </div>
                )}
                {switchTests.length > 0 && (
                  <div className="switch-results" aria-live="polite">
                    <h3>Latest requests</h3>
                    {switchTests.slice(0, 4).map(({ at, runId, result }) => (
                      <article className="switch-result" key={runId}>
                        <div className="switch-result-head">
                          <strong>{shortModel(result.model)}</strong>
                          <span
                            className={`status ${result.evaluation?.passed ? 'success' : result.error || result.evaluation ? 'failure' : ''}`}
                          >
                            {switchResultStatus(result)}
                          </span>
                        </div>
                        <div className="switch-result-metrics">
                          <span>
                            Accuracy{' '}
                            {result.evaluation ? percent(result.evaluation.accuracy) : 'Not scored'}
                          </span>
                          <span>Latency {duration(result.metadata?.latencyMs)}</span>
                          <span>Reported cost {money(result.metadata?.costUsd)}</span>
                          <time dateTime={at}>{timestamp(at)}</time>
                        </div>
                        {result.error && <p className="micro">{result.error.message}</p>}
                        <details>
                          <summary>Inspect output and gateway identity</summary>
                          {result.output && (
                            <>
                              <h3>Actual model output</h3>
                              <pre className="json">{result.output}</pre>
                            </>
                          )}
                          {result.evaluation && (
                            <>
                              <h3>Deterministic evaluation</h3>
                              <Json value={result.evaluation} />
                            </>
                          )}
                          {result.metadata && (
                            <>
                              <h3>Gateway response</h3>
                              <Json
                                value={{
                                  requestedModel: result.metadata.requestedModel,
                                  effectiveModel: result.metadata.effectiveModel,
                                  responseModel: result.metadata.responseModel,
                                  provider: result.metadata.provider,
                                  requestId: result.metadata.requestId,
                                  attempts: result.metadata.attempts,
                                  fallback: result.metadata.fallback,
                                  costUsd: result.metadata.costUsd,
                                  latencyMs: result.metadata.latencyMs,
                                }}
                              />
                            </>
                          )}
                        </details>
                      </article>
                    ))}
                    {switchDecision && availableSwitchModels.length > 1 ? (
                      <section className="switch-recommendation">
                        <h3>Model decision for this fixture</h3>
                        <p>
                          <strong>{shortModel(switchDecision.model)}</strong> led on the latest
                          valid responses for this same fixture, ranked by field accuracy, schema
                          validity, then measured latency and reported cost as tie-breakers. This
                          one-case result is not a general ranking.
                        </p>
                        {activeModel !== switchDecision.model && (
                          <button
                            className="button quiet"
                            type="button"
                            onClick={() => chooseActiveModel(switchDecision.model)}
                          >
                            Switch to {shortModel(switchDecision.model)}
                          </button>
                        )}
                      </section>
                    ) : availableSwitchModels.length > 1 ? (
                      <p className="micro">
                        Test this same fixture with another model to compare results.
                      </p>
                    ) : null}
                  </div>
                )}
              </section>
            </div>
            <p className="micro">
              <a
                href="/api/evidence?file=model-switch-production.json"
                target="_blank"
                rel="noreferrer"
              >
                Production smoke evidence
              </a>
            </p>
            <section className="experiments routing-section">
              <div className="section-head">
                <h2>Test Otari policy routing</h2>
                <span className="subtle">Separate from manual switching</span>
              </div>
              <div className="experiment-row">
                <div>
                  <h3>{catalog?.roles.policy || 'No policy configured'}</h3>
                  <p>
                    Sends one fixed synthetic classification request to this policy through hosted
                    Otari. No application-side retry is used.
                  </p>
                </div>
                <button
                  className="button quiet"
                  type="button"
                  disabled={
                    !catalog?.demoEnabled || !catalog.roles.policy || !!experimentBusy || switchBusy
                  }
                  onClick={() => runExperiment('routing')}
                >
                  {experimentBusy === 'routing' ? 'Checking…' : 'Use Otari fallback policy'}
                </button>
              </div>
              {routeCompletion && routeMetadata && (
                <div className="route-outcome" role="status">
                  <strong>
                    {routeMetadata.fallback === true
                      ? 'Automatic Otari fallback occurred'
                      : routeMetadata.fallback === false
                        ? 'Primary succeeded. Backup was not needed.'
                        : 'Otari did not report whether fallback occurred.'}
                  </strong>
                  <p>
                    Serving model: <code>{routeMetadata.effectiveModel || 'Not reported'}</code>,
                    Provider: <code>{routeMetadata.provider || 'Not reported'}</code>
                  </p>
                  <p>
                    Request: <code>{routeMetadata.requestId || 'Not reported'}</code>, attempts{' '}
                    {routeMetadata.attempts ?? 'Not reported'}, cost {money(routeMetadata.costUsd)}
                  </p>
                  <details>
                    <summary>Inspect routing response</summary>
                    <Json value={experiment?.data} />
                  </details>
                  <button className="text-button" type="button" onClick={() => navigate('trace')}>
                    Open request trace
                  </button>
                </div>
              )}
              {experiment?.id === 'routing' && !routeCompletion && (
                <div className="connection error" role="alert">
                  <strong>Routing result not verified</strong>
                  <Json value={experiment.data} />
                </div>
              )}
            </section>
          </>
        )}
        {view === 'results' &&
          (!run ? (
            <Empty
              title="No benchmark results yet"
              text="Choose a scenario and run a small, reproducible test."
              action="Set up benchmark"
              onAction={() => navigate('workspace')}
            />
          ) : (
            <>
              <div className="run-toolbar">
                <div>
                  <strong>{scenarios[run.scenario].name}</strong>
                  <span className="subtle">
                    {new Date(run.startedAt).toLocaleString()} / {run.caseCount} cases per model
                  </span>
                </div>
                <div className="toolbar-actions">
                  <button
                    className="button quiet"
                    type="button"
                    onClick={() =>
                      download(exportJson(run), `modelswitch-${run.id}.json`, 'application/json')
                    }
                  >
                    Export JSON
                  </button>
                  <button
                    className="button quiet"
                    type="button"
                    onClick={() =>
                      download(exportCsv(run), `modelswitch-${run.id}.csv`, 'text/csv')
                    }
                  >
                    Export CSV
                  </button>
                </div>
              </div>
              {busy && (
                <div className="running" role="status">
                  <span className="loader" aria-hidden="true" />
                  <span>{progress}</span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      stop.current = true;
                      setProgress('Stopping after the current request…');
                    }}
                  >
                    Stop after this request
                  </button>
                </div>
              )}
              {error && (
                <div className="connection error" role="alert">
                  <strong>
                    {error.code === 'insufficient_credit'
                      ? 'Otari account needs credit'
                      : 'Benchmark partially completed'}
                  </strong>
                  <p>{error.message}</p>
                  {error.requestId && <code>Request {error.requestId}</code>}
                  <p className="micro">
                    Unsent cases are marked skipped. No fixture responses were substituted.
                  </p>
                </div>
              )}
              <div className="table-scroll">
                <table className="results-table">
                  <caption className="sr-only">Model benchmark comparison</caption>
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Accuracy</th>
                      <th>Pass rate</th>
                      <th>Latency</th>
                      <th>Reported cost</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.summaries.map((row) => (
                      <tr key={row.model}>
                        <th scope="row">
                          <strong>{shortModel(row.model)}</strong>
                          <span className="subtle">
                            {row.failures} failures / {row.skipped} skipped
                          </span>
                        </th>
                        <td>{percent(row.accuracy)}</td>
                        <td>{percent(row.passRate)}</td>
                        <td>{duration(row.meanLatencyMs)}</td>
                        <td>{money(row.costUsd)}</td>
                        <td className="score">{row.score.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {recommend && (
                <section className="recommendation">
                  <div>
                    <h2>
                      {run.models.length === 1 ? 'Tested model' : 'Recommended for these cases'}
                    </h2>
                    <strong className="recommended-model">{shortModel(recommend.model)}</strong>
                  </div>
                  <p>
                    {run.models.length === 1
                      ? 'One model was evaluated; a comparative recommendation needs a second model.'
                      : `${shortModel(recommend.model)} ranks first because it has the highest deterministic score for the ${run.objective} objective (${recommend.score.toFixed(1)} / 100).`}{' '}
                    {decision?.moreAccurate.length ? (
                      <>
                        {shortModel(decision.moreAccurate[0].model)} was more accurate (
                        {percent(decision.moreAccurate[0].accuracy)} vs.{' '}
                        {percent(recommend.accuracy)}).{' '}
                      </>
                    ) : null}
                    {decision?.cheaper.length ? (
                      <>
                        {shortModel(decision.cheaper[0].model)} had a lower complete reported cost (
                        {money(decision.cheaper[0].costUsd)} vs. {money(recommend.costUsd)}).{' '}
                      </>
                    ) : null}
                    The score follows the selected weights, includes only these {run.caseCount}-case
                    synthetic sample{run.caseCount === 1 ? '' : 's'}, and cannot establish universal
                    model superiority.
                  </p>
                  {run.models.length > 1 &&
                    recommend.model !== activeModel &&
                    isSwitchableModel(
                      recommend.model,
                      catalog?.models ?? [],
                      catalog?.roles ?? { evaluator: '', analyst: '', policy: '' },
                    ) && (
                      <button
                        className="button quiet"
                        type="button"
                        onClick={() => chooseActiveModel(recommend.model)}
                      >
                        Switch active test model
                      </button>
                    )}
                </section>
              )}
              <details className="method-details">
                <summary>Score formula and full metrics</summary>
                <p>
                  Score = 100 × (accuracy × w₁ + reliability × w₂ + relative speed × w₃ + relative
                  cost × w₄). Reliability = 1 − failure rate. Relative speed = fastest mean latency
                  / model latency. Relative cost = lowest total / model total. Zero denominators
                  return 1. Unavailable cost or latency axes are omitted for every model; remaining
                  weights are normalized.
                </p>
                <p>
                  Objective weights: {weights[run.objective].map((w) => percent(w)).join(' / ')}{' '}
                  (accuracy / reliability / speed / cost). No successful schema-valid case means
                  score 0.
                </p>
                <Json value={run.summaries} />
              </details>
              <section className="case-results">
                <div className="section-head">
                  <h2>Case results</h2>
                  <button type="button" className="text-button" onClick={() => navigate('trace')}>
                    Inspect request trace
                  </button>
                </div>
                {run.cases.map((c) => (
                  <details key={c.model + c.caseId}>
                    <summary>
                      <span className="case-id">{c.caseId}</span>
                      <span>{shortModel(c.model)}</span>
                      <span
                        className={`status ${c.evaluation?.passed ? 'success' : c.error ? 'failure' : ''}`}
                      >
                        {c.skipped
                          ? 'Skipped'
                          : c.error
                            ? 'Error'
                            : c.evaluation?.passed
                              ? 'Passed'
                              : 'Failed'}
                      </span>
                    </summary>
                    <div className="case-result-body">
                      {c.error && <p>{c.error.message}</p>}
                      {c.skipped && <p>No request was sent for this case.</p>}
                      {c.output && (
                        <>
                          <h3>Actual model output</h3>
                          <pre className="json">{c.output}</pre>
                        </>
                      )}
                      {c.evaluation && (
                        <>
                          <h3>Deterministic field comparison</h3>
                          <Json value={c.evaluation} />
                        </>
                      )}
                      {c.metadata && (
                        <>
                          <h3>Gateway identity and usage</h3>
                          <Json value={c.metadata} />
                        </>
                      )}
                    </div>
                  </details>
                ))}
              </section>
              <section className="analyst">
                <h2>Analyst interpretation</h2>
                {run.analyst ? (
                  <>
                    <p className="analyst-content">{run.analyst.content}</p>
                    <div className="subtle">
                      {run.analyst.metadata.effectiveModel ??
                        run.analyst.metadata.responseModel ??
                        run.analyst.metadata.requestedModel}{' '}
                      / {run.analyst.metadata.provider ?? 'Provider not reported'} /{' '}
                      {money(run.analyst.metadata.costUsd)}
                    </div>
                  </>
                ) : (
                  <p className="subtle">
                    {run.analystError?.message ??
                      (busy
                        ? 'Waiting for verified results.'
                        : 'No analyst call completed. Deterministic scores are retained.')}
                  </p>
                )}
              </section>
            </>
          ))}
        {view === 'trace' && switchTests.length > 0 && (
          <section className="switch-results" aria-labelledby="model-switch-trace-heading">
            <div className="section-head">
              <h2 id="model-switch-trace-heading">Model Switch requests</h2>
              <span className="subtle">Browser-stored test activity</span>
            </div>
            <p className="micro">
              Each result separates local deterministic scoring from Otari-reported response
              identity. These are independent one-fixture checks, not part of the latest benchmark.
            </p>
            {switchTests.map(({ at, runId, result }) => (
              <article className="switch-result" key={runId}>
                <div className="switch-result-head">
                  <strong>
                    {shortModel(result.model)} / {result.caseId}
                  </strong>
                  <span
                    className={`status ${result.evaluation?.passed ? 'success' : result.error || result.evaluation ? 'failure' : ''}`}
                  >
                    {switchResultStatus(result)}
                  </span>
                </div>
                <div className="switch-result-metrics">
                  <span>{timestamp(at)}</span>
                  <span>
                    Request{' '}
                    {result.metadata?.requestId || result.error?.requestId || 'Not reported'}
                  </span>
                </div>
                <details>
                  <summary>Application score and gateway metadata</summary>
                  <Json
                    value={{
                      score: result.evaluation ?? null,
                      requestedModel: result.metadata?.requestedModel,
                      effectiveModel: result.metadata?.effectiveModel,
                      responseModel: result.metadata?.responseModel,
                      provider: result.metadata?.provider,
                      requestId: result.metadata?.requestId,
                      attempts: result.metadata?.attempts,
                      fallback: result.metadata?.fallback,
                      latencyMs: result.metadata?.latencyMs,
                      costUsd: result.metadata?.costUsd,
                      error: result.error ?? null,
                    }}
                  />
                </details>
              </article>
            ))}
          </section>
        )}
        {view === 'trace' &&
          (!run && !switchTests.length ? (
            <Empty
              title="No requests to inspect"
              text="Each benchmark records local events and gateway metadata separately."
              action="Set up benchmark"
              onAction={() => navigate('workspace')}
            />
          ) : (
            <>
              <div className="trace-key">
                <span>Application events</span>
                <span className="gateway-badge">Gateway-reported metadata</span>
                {run && <code>{run.id}</code>}
              </div>
              <ol className="timeline">
                {(run?.trace ?? []).map((event, i) => (
                  <li key={i} className={event.source === 'gateway' ? 'gateway-event' : ''}>
                    <div className="event-time">
                      <span className="event-index">{String(i + 1).padStart(2, '0')}</span>
                      <time dateTime={event.at}>{new Date(event.at).toLocaleTimeString()}</time>
                    </div>
                    <details>
                      <summary>
                        <strong>{event.label}</strong>
                        <span className="status">
                          {event.source === 'gateway' ? 'Gateway' : 'Application'}
                        </span>
                      </summary>
                      <Json value={event.detail} />
                    </details>
                  </li>
                ))}
              </ol>
            </>
          ))}
        {view === 'capabilities' && (
          <>
            <div className="evidence-summary">
              <strong>{liveAdvancedPoints} / 60 advanced points verified</strong>
              <p>Hosted discovery is evidence of availability. It is not evidence of execution.</p>
            </div>
            <div className="table-scroll">
              <table className="capability-table">
                <thead>
                  <tr>
                    <th>Otari capability</th>
                    <th>Points</th>
                    <th>Status</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {caps.map((cap) => (
                    <CapabilityRow key={cap.id} cap={cap} />
                  ))}
                </tbody>
              </table>
            </div>
            <section className="experiments">
              <div className="section-head">
                <h2>Controlled capability checks</h2>
                <span className="subtle">One request per check</span>
              </div>
              <div className="experiment-row">
                <div>
                  <h3>Routing policy</h3>
                  <p>Inspect the actual serving model and fallback headers.</p>
                </div>
                <button
                  className="button quiet"
                  type="button"
                  disabled={!!experimentBusy || !catalog?.demoEnabled || !catalog?.roles.policy}
                  onClick={() => runExperiment('routing')}
                >
                  {experimentBusy === 'routing' ? 'Checking…' : 'Check routing'}
                </button>
              </div>
              <div className="experiment-row">
                <div>
                  <h3>Python metric control</h3>
                  <p>Fixed vectors, expected accuracy 4/5. Executed by Otari.</p>
                </div>
                <button
                  className="button quiet"
                  type="button"
                  disabled={
                    !!experimentBusy ||
                    !catalog?.demoEnabled ||
                    !catalog.tools.some((t) => t.id === 'otari_code_execution' && t.available)
                  }
                  onClick={() => runExperiment('code')}
                >
                  {experimentBusy === 'code' ? 'Checking…' : 'Check sandbox'}
                </button>
              </div>
              <div className="experiment-row">
                <div>
                  <h3>Repository evidence inspector</h3>
                  <p>Qwen reads the public Otari repository through DeepWiki MCP.</p>
                </div>
                <button
                  className="button quiet"
                  type="button"
                  disabled={!!experimentBusy || !catalog?.demoEnabled}
                  onClick={() => runExperiment('mcp')}
                >
                  {experimentBusy === 'mcp' ? 'Inspecting…' : 'Inspect repository'}
                </button>
              </div>
              <div className="experiment-row">
                <div>
                  <h3>Public document</h3>
                  <label className="sr-only" htmlFor="public-source">
                    Public document source
                  </label>
                  <select
                    id="public-source"
                    name="public-source"
                    value={source}
                    onChange={(e) => setSource(e.target.value as typeof source)}
                  >
                    {Object.entries(sources).map(([key, s]) => (
                      <option key={key} value={key}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                  <a
                    className="source-url"
                    href={sources[source].url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {sources[source].url}
                  </a>
                </div>
                <button
                  className="button quiet"
                  type="button"
                  disabled={
                    !!experimentBusy ||
                    !catalog?.demoEnabled ||
                    !catalog.tools.some((t) => t.id === 'otari_web_fetch' && t.available)
                  }
                  onClick={() => runExperiment('web')}
                >
                  {experimentBusy === 'web' ? 'Checking…' : 'Fetch through Otari'}
                </button>
              </div>
              <div className="experiment-row">
                <div>
                  <h3>Prompt-injection fixture</h3>
                  <p>Inference guardrail requested in block mode, failing closed.</p>
                </div>
                <button
                  className="button quiet"
                  type="button"
                  disabled={!!experimentBusy || !catalog?.demoEnabled}
                  onClick={() => runExperiment('guardrail')}
                >
                  {experimentBusy === 'guardrail' ? 'Checking…' : 'Check guardrail'}
                </button>
              </div>
            </section>
            {experiment && (
              <section
                id="capability-check-result"
                className="experiment-result"
                aria-live="polite"
              >
                <div className="section-head">
                  <h2>
                    {experiment.data.verified
                      ? 'Live check verified'
                      : 'Check recorded, unverified'}
                  </h2>
                  <button
                    type="button"
                    className="button quiet"
                    onClick={() =>
                      download(
                        JSON.stringify(experiment, null, 2) + '\n',
                        `otari-${experiment.id}.json`,
                        'application/json',
                      )
                    }
                  >
                    Export evidence
                  </button>
                </div>
                <Json value={experiment.data} />
              </section>
            )}
            <p className="micro">
              Checks consume real gateway usage when admitted. Export new evidence and have the
              operator review it before changing the published matrix.
            </p>
          </>
        )}
        {view === 'guide' && (
          <Guide onStart={() => navigate('workspace')} onSwitch={() => navigate('model-switch')} />
        )}
      </main>
      <section className="shell latest-run" aria-labelledby="latest-run-title">
        <div className="latest-run-head">
          <h2 id="latest-run-title">Latest run</h2>
          <span className="subtle">This browser only</span>
        </div>
        {run ? (
          <div className="latest-run-content">
            <div className="latest-run-facts">
              <div>
                <span>Scenario</span>
                <strong>{scenarios[run.scenario].name}</strong>
              </div>
              <div>
                <span>Models</span>
                <strong>{run.models.map(shortModel).join(', ')}</strong>
              </div>
              <div>
                <span>Accuracy / pass rate</span>
                <strong>
                  {run.summaries
                    .map(
                      (row) =>
                        `${shortModel(row.model)} ${percent(row.accuracy)} / ${percent(row.passRate)}`,
                    )
                    .join('; ')}
                </strong>
              </div>
              <div>
                <span>Reported cost</span>
                <strong>
                  {reportedCostsComplete
                    ? money(
                        run.summaries.reduce((sum, row) => sum + (row.costUsd ?? 0), 0) +
                          (run.analyst?.metadata.costUsd ?? 0),
                      )
                    : 'Incomplete'}
                </strong>
              </div>
              <div>
                <span>Execution</span>
                <strong>{run.state === 'complete' ? 'Complete' : 'Interrupted or partial'}</strong>
              </div>
              <div>
                <span>Started</span>
                <strong>{timestamp(run.startedAt)}</strong>
              </div>
            </div>
            <div className="latest-run-links">
              {viewAnchor('results', 'Detailed results')}
              {viewAnchor('trace', 'Request trace')}
            </div>
          </div>
        ) : (
          <div className="latest-run-empty">
            <p>No run is saved in this browser yet.</p>
            <button className="text-button" type="button" onClick={() => navigate('workspace')}>
              Set up a benchmark
            </button>
          </div>
        )}
      </section>
      <footer className="shell footer">
        <section className="footer-group footer-product">
          {viewAnchor(
            'workspace',
            <>
              <Mark size={24} />
              <span>
                ModelSwitch <span className="brand-lab">Lab</span>
              </span>
            </>,
            'footer-brand',
            'ModelSwitch Lab workspace',
          )}
          <p>Compare real hosted model runs against small, reproducible tests.</p>
        </section>
        <nav className="footer-group" aria-label="Explore">
          <h2>Explore</h2>
          {viewAnchor('workspace', 'Workspace')}
          {viewAnchor('results', 'Results')}
          {viewAnchor('trace', 'Request trace')}
          {viewAnchor('capabilities', 'Otari capabilities')}
        </nav>
        <nav className="footer-group" aria-label="Resources">
          <h2>Resources</h2>
          <a href="https://github.com/sopskistar/modelswitch-lab/blob/main/docs/JUDGE_WALKTHROUGH.md">
            Judge walkthrough
          </a>
          <a href="https://github.com/sopskistar/modelswitch-lab/blob/main/docs/ARCHITECTURE.md">
            Architecture
          </a>
          <a href="https://github.com/sopskistar/modelswitch-lab/blob/main/docs/TESTING.md">
            Testing
          </a>
          <a href="https://github.com/sopskistar/modelswitch-lab">GitHub repository</a>
        </nav>
        <section className="footer-group">
          <h2>About</h2>
          <span>MozFest Developers Wilding Online 2026</span>
          <a href="https://github.com/mozilla-ai/otari">Powered by Mozilla Otari</a>
          <a href="https://github.com/sopskistar/modelswitch-lab/blob/main/LICENSE">MIT License</a>
          <a href="https://github.com/sopskistar/modelswitch-lab/blob/main/docs/RUBRIC_EVIDENCE.md">
            Verified rubric evidence
          </a>
        </section>
      </footer>
    </>
  );
}
function Empty({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="empty">
      <Mark />
      <h2>{title}</h2>
      <p>{text}</p>
      <button type="button" className="button primary" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}
function CapabilityRow({ cap }: { cap: Capability }) {
  const href = cap.file.startsWith('#') ? cap.file : `/api/evidence?file=${cap.file}`;
  return (
    <tr>
      <th scope="row">
        <strong>{cap.name}</strong>
        <span className="subtle">{cap.detail}</span>
      </th>
      <td>{cap.points}</td>
      <td>
        <span className="status">{cap.status}</span>
      </td>
      <td>
        <a href={href} target={href.startsWith('#') ? undefined : '_blank'} rel="noreferrer">
          Inspect JSON
        </a>
      </td>
    </tr>
  );
}
function Guide({ onStart, onSwitch }: { onStart: () => void; onSwitch: () => void }) {
  return (
    <div className="guide-layout">
      <div className="guide-content">
        <section>
          <h2>Run a reproducible benchmark</h2>
          <ol>
            <li>Choose extraction, classification, or bounded reasoning.</li>
            <li>Select one or two discovered models and 1, 3, or 5 cases.</li>
            <li>Choose an objective and run the benchmark.</li>
            <li>
              Open a case to compare its expected and actual fields. Export the run or inspect its
              trace.
            </li>
          </ol>
          <button type="button" className="button primary" onClick={onStart}>
            Open workspace
          </button>
        </section>
        <section>
          <h2>Switch the active test model</h2>
          <p>
            Open Model switch, choose a catalog model already configured for an evaluator or analyst
            role, then explicitly test the same synthetic invoice fixture. A model switch changes
            future test request IDs only; it does not change the analyst configuration, an external
            application, or an Otari routing policy. The result includes the actual serving model,
            provider, request ID, latency, reported cost, and deterministic fixture score.
          </p>
          <button type="button" className="button quiet" onClick={onSwitch}>
            Open Model switch
          </button>
        </section>
        <section>
          <h2>Two models, two jobs</h2>
          <p>
            The evaluator processes synthetic input. Local deterministic scoring checks its output
            against known answers. The analyst receives server-signed metrics in a separate Otari
            request and explains the recommendation. It cannot change the score.
          </p>
          <p>
            Configured models: Qwen3.8 27B and Llama 3.3 70B Instruct. Model identity is read from
            the gateway; access and licenses must be checked against the catalog and model cards.
          </p>
        </section>
        <section>
          <h2>Read the evidence</h2>
          <p>
            The trace distinguishes application events from gateway-reported request IDs, model,
            provider, attempt count, fallback, usage, tool calls, and guardrails. Missing values
            stay unknown. Request latency is measured by this server; gateway duration is labeled
            separately.
          </p>
          <p>
            The capabilities page contains all eight rubric features and controlled checks. A
            feature earns no verified points until its real execution evidence is present. A $0
            balance refusal does not prove budget enforcement.
          </p>
        </section>
        <section>
          <h2>Score methodology</h2>
          <p>
            Accuracy is the fraction of expected fields matched after Unicode, case, and whitespace
            normalization. Pass rate requires every field to match and strict schema validity.
            Failed and skipped cases receive zero accuracy. Reliability includes schema failures,
            request failures, and skipped cases.
          </p>
          <p>
            Recommendation weights (accuracy / reliability / speed / cost): balance 55/20/15/10;
            accuracy 80/15/2.5/2.5; speed 35/15/45/5; cost 40/15/5/40. Unknown axes are omitted for
            every model and remaining weights normalized. Tiny samples describe tested cases only.
          </p>
        </section>
        <section>
          <h2>Configure the server</h2>
          <p>
            Use the repository’s{' '}
            <a
              href="https://github.com/sopskistar/modelswitch-lab/blob/hackathon/mozfest-otari-2026/.env.example"
              target="_blank"
              rel="noreferrer"
            >
              environment template
            </a>
            . Set the hosted key, account region, two accessible model IDs, and an optional policy
            name. Add account credit and attach a hard key budget in Otari.
          </p>
          <p>
            For Vercel, explicitly enable the public demo and configure the durable Redis rate
            limiter. Server keys never enter browser requests. Public inference stays off when the
            production limiter is missing.
          </p>
        </section>
        <section>
          <h2>What persists</h2>
          <p>
            One recent run and your theme stay in this browser’s local storage. Reloading during a
            run restores completed cases and marks the run interrupted. There is no account, shared
            result database, or automatic resumption. Export JSON to retain a run. Otari retains its
            own gateway logs under its account policies.
          </p>
        </section>
      </div>
      <aside className="guide-aside">
        <h2>Judge’s route</h2>
        <a href="?view=workspace">1. Workspace</a>
        <a href="?view=model-switch">2. Switch a test model</a>
        <a href="?view=results">3. Results and scoring</a>
        <a href="?view=trace">4. Request evidence</a>
        <a href="?view=capabilities">5. Capability checks</a>
        <hr />
        <p className="subtle">
          Record your real screen and personally narrate the demo. The repository includes a 3 to 5
          minute recording script.
        </p>
        <a
          href="https://github.com/sopskistar/modelswitch-lab/blob/hackathon/mozfest-otari-2026/docs/JUDGE_WALKTHROUGH.md"
          target="_blank"
          rel="noreferrer"
        >
          Full walkthrough
        </a>
      </aside>
    </div>
  );
}
