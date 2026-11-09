# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`coffee-cli` is a terminal app built with [Ink](https://github.com/vadimdemedes/ink) (React for the CLI), scaffolded from `create-ink-app`. It is currently at the scaffold stage: a single greeting component.

## Commands

- `npm run build` — compile `source/` to `dist/` with `tsc`
- `npm run dev` — `tsc --watch`
- `npm test` — runs, in order: `prettier --check .`, `xo` (lint), `ava` (tests). Any of the three failing fails the suite.
- Run a single test: `npx ava test.tsx --match "greet user with a name"`
- Lint only / autofix: `npx xo` / `npx xo --fix`
- Run the built CLI: `node dist/cli.js --name=Jane` (requires `npm run build` first)

## Architecture

- `source/cli.tsx` — entry point (`bin` → `dist/cli.js`). Parses flags with `meow` (help text and flag definitions live here) and calls Ink's `render()` on `<App>`.
- `source/app.tsx` — root React component; receives parsed flags as props. UI is composed from Ink primitives (`Text`, `Box`, etc.), not DOM elements.
- `test.tsx` (repo root, not in `source/`) — ava tests that render components with `ink-testing-library` and assert on `lastFrame()`. Expected strings include ANSI color codes, so build them with `chalk` (e.g. `chalk.green('Jane')`) rather than plain text.

## Conventions and gotchas

- ESM-only (`"type": "module"`). Relative imports must use the `.js` extension even when importing `.tsx` files (e.g. `import App from './app.js'`).
- Tests run TypeScript directly via `ts-node/esm` loader (configured in `package.json` `ava` section); no build step needed for tests.
- `tsconfig.json` extends `@sindresorhus/tsconfig` (strict) and only includes `source/`.
- Formatting: tabs, LF, Prettier config `@vdemedes/prettier-config`; xo extends `xo-react` with `react/prop-types` off.
