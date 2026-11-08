# Hallmark rendered audit

## Final mobile navigation pass — 2026-11-08

The existing Console tokens, type, logo, accent and desktop tabs are preserved.
The mobile landing CTA has its own row; every workspace view has **Back to home**
and a compact **Views** disclosure showing the current section. Expanded request
IDs wrap within their metrics row, and mobile evidence/footer links have larger
touch targets. No global overflow rule was added to conceal layout defects.

The rendered audit covered `/` and all six `/app?view=` destinations:
**0 FAIL, 0 REFLEX, 0 WARN**, across three source files and seven URLs.
It produced 35 captures: 1280×800, 1440×900, 1920×1080, 1440px full page and
375px full page for each route. The workspace, Model Switch and landing renders
were visually reviewed. Playwright separately measures all six phone widths
with the existing root clipping temporarily disabled and expands saved-data
disclosures to check long IDs and JSON.

A final mobile evidence-link spacing adjustment stacks related links with a
gap. The affected Capabilities view was rendered again at all five audit sizes:
**0 FAIL, 0 REFLEX, 0 WARN**. Other views retain the already audited layout.

```sh
CHROME_PATH=/home/sopski/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome \
  node /home/sopski/.agents/skills/hallmark/scripts/sloplint.mjs \
  src/components/landing-page.tsx src/components/workbench.tsx src/app/globals.css \
  --genre modern-minimal --scope app --render \
  --url http://localhost:3110/ \
  --url 'http://localhost:3110/app?view=workspace' \
  --url 'http://localhost:3110/app?view=model-switch' \
  --url 'http://localhost:3110/app?view=results' \
  --url 'http://localhost:3110/app?view=trace' \
  --url 'http://localhost:3110/app?view=capabilities' \
  --url 'http://localhost:3110/app?view=guide'
```

The earlier audit below is retained as historical context.

Hallmark was used to extend the existing graphite-and-paper console with its warm accent. The landing page and Model Switch view reuse the current token system, logo and application structure. The product preview is a real saved results capture; generated marketing imagery and synthetic metrics were not added.

Command:

```sh
CHROME_PATH=/home/sopski/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome \
  node /home/sopski/.agents/skills/hallmark/scripts/sloplint.mjs \
  src/components/landing-page.tsx src/app/page.tsx src/app/globals.css \
  --genre modern-minimal --scope app --render --url http://localhost:3110/
```

The first landing audit found a 4px overflow in the 375px header. The header action gap and button padding were reduced using existing spacing tokens. The Model Switch audit then flagged the long production-evidence link at 320px; its visible label was shortened. Final landing and Model Switch audits each rendered five sizes (1280×800, 1440×900, 1920×1080, 1440px full page and 375px full page) and reported **0 FAIL, 0 REFLEX, 0 WARN**. Playwright then confirmed no horizontal overflow and no axe violations on tested landing and workspace screens at desktop and mobile widths.

Rendered audit captures are in the ignored `.hallmark/shots/` directory; judge-facing screenshots are [`landing desktop`](screenshots/landing-desktop.png), [`landing mobile`](screenshots/landing-mobile.png), [`Model Switch desktop`](screenshots/model-switch-desktop.png), and [`Model Switch mobile`](screenshots/model-switch-mobile.png). The audit outcome and direction are also recorded in `.hallmark/log.json` and `.hallmark/preflight.json`.
