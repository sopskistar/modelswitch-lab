# Hallmark design record

Installed skill used: `/home/sopski/.agents/skills/hallmark/SKILL.md`, v2.0.0.
Read its Codex harness/app-screen instructions, Console theme, craft, patterns,
dark-mode guidance, gates and finish review. This is an app screen; marketing
hero, imagery slots and section rhythm do not apply. No stock images or invented
product metrics were introduced. The [upstream project](https://github.com/Nutlope/hallmark)
was also inspected.

Preflight and direction are retained in `.hallmark/preflight.json` and
`.hallmark/log.json`. The initial deal offered Console, Terrazzo and Lumen; all
three reference pictures were inspected. Console was chosen for its measured
records and developer workbench material. Its graphite and paper colorways are
paired with Host Grotesk and Atkinson Hyperlegible Mono, self-hosted with OFL
licenses in `public/fonts`. Amber marks actions and selection; instrument
evidence uses cool text. The uploaded ModelSwitch PNG mark is used without
geometry changes; light mode inverts the white mark while dark mode preserves it.

Signature: a ledger of versioned benchmark cases with known expected outputs,
followed by the request timeline. The product itself is the visual material.
Native controls and details elements keep mouse and keyboard interactions
familiar. Tables become labeled blocks on mobile; the tab strip scrolls rather
than wrapping. The container is capped. Motion is limited to request loading,
with a reduced-motion fallback.

## Actual audit

Ran the installed command against source and the live application:

```sh
CHROME_PATH=/home/sopski/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome node ~/.agents/skills/hallmark/scripts/sloplint.mjs \
  src/app/globals.css src/components --scope app --genre modern-minimal \
  --render --url http://localhost:3010
```

`docs/HALLMARK_LINT.txt` records **0 FAIL, 0 REFLEX, 0 WARN** on that source
revision. The final source/render confirmation passed on port 3010. The render tier actually ran and wrote five screenshots: 1280×800,
1440×900, 1920×1080, full 1440, and full 375. Retained captures are in
`.hallmark/shots/`; unmocked light/dark product captures are in
`docs/screenshots/*-live.png`. Final result captures replay the exact saved
live run from browser-smoke.json through normal browser persistence, without
additional inference. This is a real recorded result, not an intercepted fixture.

The first static audit found a copy dash and an active-state rule the scanner
misread as a disabled state. Both were changed and the audit rerun. Browser
startup initially failed under the sandbox; approved execution was used rather
than claiming the render tier had run.

## Polish pass

The merged `main` included `modelswitch-icon (1).png`; no uploaded SVG logo was
present. The PNG now supplies the desktop/mobile header, footer, favicon, app
icon, Open Graph image, and README identity. The existing wordmark type remains.
The homepage now ends in a current-browser run summary and a responsive four
group footer. Empty state, footer navigation, icon contrast in light/dark mode,
and receipt export are covered by the expanded Playwright suite. The final audit
result is recorded in `HALLMARK_LINT.txt`.

## In-thread finish review

Codex's Hallmark harness calls for an in-thread review. No independent reviewer
or fresh-context review is claimed. Applied the actual finish-review prompt to
the rendered app and source; app-specific checks replace hero checks.

Verdict: **fix**, then resolved.

1. The desktop primary action was below the first viewport. Moved the single
   Run benchmark control into the desktop header, preserving form order and the
   bottom position on mobile. Confirmed in the 1280 screenshot.
2. Scenario controls could accept native input before React hydration. Disabled
   form controls until browser initialization; scenario selection and URL state
   now pass in both browser projects.
3. Mobile result metric names include visible labels in their accessible name.
   Corrected the test to inspect the actual labeled cells. The labels and values
   remain visible and exposed to assistive technology.
4. The unmocked production check found the server's Origin comparison used an
   internal bind address. Fixed against the public Host/protocol, added a route
   regression, and recaptured the actual runtime. This is functional QA rather
   than a design gate, but the real error state exposed it.

Judged checks: restrained accent footprint, one heading treatment, no decoration
without a job, no card-inside-card structure, no mock analytics or fabricated
evidence, readable native focus, balanced tables, all content available on mobile,
and explicit missing-configuration/empty/loading/failed/completed states. Unknown
metrics stay unknown. The theme describes the actual screen; no material gap or
missing image slot remains. Preserve the expected-answer ledger and source split
while making further changes.

Automated axe checks are part of the actual Playwright runs; they supplement
the rendered inspection and are not a complete accessibility certification.
