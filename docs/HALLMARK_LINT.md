# Hallmark rendered audit

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
