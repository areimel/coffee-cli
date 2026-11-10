# coffee-cli microsite

Astro landing page and complete public user guide, adapted from the Kojima template. See [TEMPLATE.md](TEMPLATE.md) for provenance.

## Develop

Use current Node 24 LTS (24.15 or newer) and npm 10.8.2 or newer. From the repository root:

```sh
npm --prefix site ci
npm --prefix site run dev
```

Open `http://localhost:4321/coffee-cli/`. The CLI remains an independent project; its root commands are unchanged.

## Verify

```sh
npm --prefix site run format:check
npm --prefix site run check
npm --prefix site run build
cd site
npx playwright install chromium
npm run test:e2e
```

Browser checks serve the production build on port 4322 and cover nested routes, local assets, accessibility in both palettes, terminal preview selection, copying, keyboard navigation, storage restrictions, narrow screens, and JavaScript-free reading. Playwright stops its preview server when the run completes. Generated output and reports are ignored.

## Content and appearance

User guides live in `src/pages/docs/` and use the shared docs layout. Keep examples aligned with the CLI source and root README. The preview contains illustrative values; it never holds sleep locks or monitors the visitor's machine. Its palette selector is independent of the site's dark/light mode.

`src/styles/kojima.css` retains upstream tokens; shared layout styles live in `global.css`. All local navigation and public assets use the configured base path through `src/lib/urls.ts`. Local fonts are bundled by Astro. Social preview sources are in `public/og-image.svg` and `public/og-image.png`.

## GitHub Pages

The production URL is `https://areimel.github.io/coffee-cli/`. There is no custom domain. `.github/workflows/site.yml` validates pull requests and deploys successful `main` builds or manual dispatches on `main`.

In the GitHub repository, select **Settings → Pages → Build and deployment → Source → GitHub Actions**. Push/merge the site changes to `main` to run the workflow. The `github-pages` environment must permit deployment from `main`. This checkout does not change repository settings or publish by itself.

If the repository name or hosting changes, update `site` and `base` in `astro.config.mjs` together, then rerun the browser checks against the new base URL. Static documentation needs no secrets, backend, or runtime configuration.
