'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mark } from './mark';

function ThemeButton() {
  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label="Toggle color theme"
      onClick={() => {
        const next = document.documentElement.dataset.mode === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.mode = next;
        try {
          localStorage.setItem('msl-theme', next);
        } catch {}
      }}
    >
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
    </button>
  );
}

export function LandingPage() {
  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <header className="topbar landing-header">
        <div className="shell topbar-inner">
          <Link href="/" className="brand" aria-label="ModelSwitch Lab home">
            <Mark />
            <span>
              ModelSwitch <span className="brand-lab">Lab</span>
            </span>
          </Link>
          <nav className="landing-nav" aria-label="Main navigation">
            <a href="#workflow">How it works</a>
            <Link href="/app?view=capabilities">Otari evidence</Link>
            <a
              href="https://github.com/sopskistar/modelswitch-lab"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
          <div className="landing-actions">
            <ThemeButton />
            <Link className="button primary" href="/app">
              Launch app
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="landing-main">
        <section className="shell landing-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">Find the right model. Switch with confidence.</h1>
            <p>
              Test open-weight AI models, compare failures, speed and costs, then switch your active
              test model or inspect an Otari routing policy.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/app?view=model-switch">
                Launch workspace
              </Link>
              <a className="button quiet" href="#workflow">
                See how it works
              </a>
            </div>
          </div>
          <figure className="hero-preview">
            <a href="/app?view=model-switch" aria-label="Open the ModelSwitch Lab app">
              <Image
                src="/model-switch-preview.png"
                width={1440}
                height={1795}
                alt="Historical ModelSwitch Lab results view showing a real Qwen support-classification request, its measured score, reported cost, a separate Llama analyst response, and links to trace and export."
              />
            </a>
            <figcaption>
              Actual results from a one-case hosted run, Nov 4, 2026. The analyst is a separate
              request; this is not a model comparison.
            </figcaption>
          </figure>
        </section>

        <section
          id="workflow"
          className="shell landing-section workflow-section"
          aria-labelledby="workflow-title"
        >
          <div className="section-intro">
            <h2 id="workflow-title">Three steps to a model decision</h2>
            <p>
              A recommendation only matters when it changes the next request. ModelSwitch makes that
              step explicit and inspectable.
            </p>
          </div>
          <ol className="workflow-list">
            <li>
              <div>
                <h3>Test</h3>
                <p>
                  Run the same bounded, synthetic fixture against a permitted open-weight model.
                </p>
              </div>
            </li>
            <li>
              <div>
                <h3>Compare</h3>
                <p>
                  Check its output against known fields. Inspect accuracy, schema validity, latency,
                  reported cost and request errors.
                </p>
              </div>
            </li>
            <li>
              <div>
                <h3>Switch</h3>
                <p>
                  Choose another active test model and send the same fixture through Otari. The
                  analyst role stays independent.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className="shell landing-section failure-section" aria-labelledby="failure-title">
          <div>
            <h2 id="failure-title">See where a model lets you down.</h2>
            <p>
              Small, reproducible tests surface the differences that matter before you choose a
              model for a workload.
            </p>
          </div>
          <ul className="failure-list">
            <li>Incorrect fields or categories</li>
            <li>Invalid structured output</li>
            <li>Failed or interrupted requests</li>
            <li>Slower responses or higher measured cost</li>
            <li>Provider selection and routing events reported by Otari</li>
          </ul>
        </section>

        <section className="shell landing-section routing-section" aria-labelledby="routing-title">
          <div className="section-intro">
            <h2 id="routing-title">A switch is not a fallback.</h2>
            <p>ModelSwitch keeps user choice and gateway behavior separate.</p>
          </div>
          <dl className="routing-definitions">
            <div>
              <dt>Recommendation</dt>
              <dd>A deterministic suggestion from the benchmark results and selected objective.</dd>
            </div>
            <div>
              <dt>Model switch</dt>
              <dd>
                Your browser-scoped choice changes the model ID on later ModelSwitch test requests.
              </dd>
            </div>
            <div>
              <dt>Otari routing</dt>
              <dd>
                A named policy sent to the hosted gateway; Otari reports which model and provider
                served it.
              </dd>
            </div>
            <div>
              <dt>Fallback</dt>
              <dd>
                A gateway event only when Otari reports an attempted backup. A successful primary
                means no fallback occurred.
              </dd>
            </div>
          </dl>
        </section>

        <section className="shell landing-judge" aria-labelledby="judge-title">
          <div>
            <h2 id="judge-title">Open the evidence.</h2>
            <p>
              Inspect the real request trace, hosted capability receipts and the steps to reproduce
              each verified integration.
            </p>
          </div>
          <nav className="landing-judge-links" aria-label="Project links">
            <Link className="button primary" href="/app?view=model-switch">
              Launch app
            </Link>
            <a href="https://github.com/sopskistar/modelswitch-lab/blob/main/docs/JUDGE_WALKTHROUGH.md">
              Judge walkthrough
            </a>
            <Link href="/app?view=capabilities">Verified evidence</Link>
            <a href="https://github.com/sopskistar/modelswitch-lab">GitHub repository</a>
          </nav>
        </section>
      </main>

      <footer className="shell landing-footer">
        <Link href="/" className="footer-brand">
          <Mark size={24} />
          ModelSwitch <span className="brand-lab">Lab</span>
        </Link>
        <span>MozFest Developers Wilding Online 2026</span>
        <a href="https://github.com/mozilla-ai/otari">Powered by Mozilla Otari</a>
        <a href="https://github.com/sopskistar/modelswitch-lab/blob/main/LICENSE">MIT License</a>
      </footer>
    </>
  );
}
