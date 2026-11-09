# CLAUDE.md

Guidance for Claude Code and every subagent working in this repo. Read it in full before writing code. The design spec at `docs/superpowers/specs/2026-11-09-coffee-cli-design.md` is the source of truth; this file is the working summary.

## Overview

`coffee-cli` is a rich terminal (Ink 8 / React 19) equivalent of macOS `caffeinate`: it keeps the machine awake from launch, shows an ANSI Shadow `COFFEE` heading, a coffee cup with animated steam, live machine stats, and lets the user change session options (duration / until / indefinite, display lock, AC-only, minimum battery, wait on PID) and themes (amber, green, Severance) in-app. Linux and macOS only. **Current state:** only the toolchain upgrade has landed (`source/cli.tsx` and `source/app.tsx` are still the scaffold greeting); the work packages build everything below.

## Commands

| Task                      | Command                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| Build (`source/`→`dist/`) | `npm run build`                                                         |
| Watch build               | `npm run dev`                                                           |
| Full suite                | `npm test` (prettier --check, xo, `tsc -p tsconfig.test.json`, ava)     |
| One test file             | `npm run ava -- test/core/duration.test.ts`                             |
| One test by title         | `npm run ava -- test/core/duration.test.ts --match "parses 1h30m"`      |
| Lint one path             | `npx xo source/ui` (shows rule ids)                                     |
| Lint autofix              | `npx xo --fix source/ui` (prettier runs inside xo)                      |
| Format check / fix        | `npx prettier --check <paths>` / `npx prettier --write <paths>`         |
| Type-check only           | `npx tsc -p tsconfig.test.json` (covers `source/`, `test/`, `scripts/`) |
| Run the built CLI         | `node dist/cli.js` (after `npm run build`)                              |

Plain `npx ava` does NOT work: tsx needs `TSX_TSCONFIG_PATH=tsconfig.test.json`, which `npm run ava` sets.

## Architecture

The layout (planned; created by the work packages):

| Path                      | Single responsibility                                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `source/cli.tsx`          | meow flags, platform gate, TTY vs plain, `render()`, exit code                                                                                 |
| `source/app.tsx`          | providers + `DashboardLayout`                                                                                                                  |
| `source/plain-mode.ts`    | non-TTY runner: one log line per state change                                                                                                  |
| `source/lifecycle.ts`     | `exit` / SIGINT / SIGTERM / SIGHUP / crash hooks → `supervisor.releaseAllSync()`                                                               |
| `source/core/`            | pure logic: `duration.ts`, `clock-time.ts`, `format.ts`                                                                                        |
| `source/core/session/`    | `types.ts`, `machine.ts` (pure reducer), `conditions.ts` (pure), `supervisor.ts`                                                               |
| `source/config/`          | `schema.ts`, `merge.ts`, `paths.ts` (pure); `store.ts` (the only fs access here)                                                               |
| `source/platform/`        | all OS access: `types.ts`, `index.ts`, `spawn-lock.ts`, `process-alive.ts`, `unsupported.ts`                                                   |
| `source/platform/linux/`  | `detect.ts`, `adapter.ts`, `display-xset.ts`, `battery-read.ts`, `battery-parse.ts`                                                            |
| `source/platform/darwin/` | `adapter.ts`, `battery-read.ts`, `pmset-parse.ts`                                                                                              |
| `source/theme/`           | `tokens.ts` (contract), `palettes.ts`, `resolve.ts` (colour level), `context.tsx`                                                              |
| `source/ui/kit/`          | themed primitives: `T`, `Panel`, `SelectList`, `Toggle`, `TextField`, `NumberField`, `FieldRow`, `KeyHints`, `StatRow`, `ProgressBar`, `Badge` |
| `source/ui/hooks/`        | `use-session`, `use-stats`, `use-layout`, `use-keymap`                                                                                         |
| `source/features/*/`      | one screen region each: `heading`, `cup`, `status`, `stats`, `options`, `themes`, `help`                                                       |
| `source/layouts/`         | `DashboardLayout.tsx`: arranges regions per breakpoint                                                                                         |
| `scripts/`                | `generate-heading.ts` (figlet → `features/heading/heading-art.ts`, generated, committed)                                                       |
| `test/`                   | mirrors `source/`; `helpers/`, `fixtures/`                                                                                                     |

### Session model

- States: `starting`, `awake`, `degraded` (system held, display unavailable), `paused`, `stopped{reason}`, `unsupported`.
- Stop reasons: `user`, `duration`, `until`, `pid-exited`, `on-battery`, `battery-low`, `lock-failed`, `signal`.
- `machine.ts` is a pure reducer; `conditions.ts` is `evaluate(options, snapshot) -> StopReason | null`.
- `supervisor.ts` is NOT React: `getState()` / `subscribe()`, clock and scheduler injected. One 1 s tick; battery re-read every 15 s. React reads it via `use-session`.
- One lock handle per kind (`system`, `display`) so each is reported honestly.
- Live edits to timing / battery / PID only swap predicates; the display toggle acquires/releases the display lock (new before old).
- A dying lock child is retried (0.5 s, 2 s, 5 s). Display still failing → `degraded`; system still failing → `stopped(lock-failed)` with stderr shown.
- Space pauses/resumes (locks released, app stays open). Only automatic stop conditions exit the app, with a one-line summary.

### Lock mechanisms

| Platform      | System lock                                                                          | Display lock                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| macOS         | `caffeinate -i -w <nodePid>`                                                         | `caffeinate -d -w <nodePid>`                                                                                                                                               |
| Linux         | `systemd-inhibit --what=sleep:idle --mode=block … tail --pid=<nodePid> -f /dev/null` | GNOME: `gnome-session-inhibit --inhibit idle … tail --pid=<nodePid> -f /dev/null`; X11 non-GNOME: `xset s off -dpms` with saved-state restore + watchdog; else unavailable |
| Windows / WSL | unsupported message                                                                  | —                                                                                                                                                                          |

### Config layering

- `defaults < file < flags`. Flag values are session-only unless the user then edits that field in-app.
- Path: `$XDG_CONFIG_HOME/coffee-cli/config.json` (fallback `~/.config/…`); macOS `~/Library/Application Support/coffee-cli/config.json`; overridden by `COFFEE_CLI_CONFIG` or `--config`.
- Schema v1: `{version, theme, session: {end, display, acOnly, minBattery}, ui: {animation}}`. The PID is never saved.
- Bad field → its default; unparseable JSON → renamed `config.corrupt-<timestamp>.json`; newer `version` → loaded read-only. Saved atomically 500 ms after an in-app change.
- Invalid or conflicting flags exit with code 2.

## Hard rules

1. **Pure / impure split.** `source/core/**` and every `*-parse.ts` never import `node:fs`, `node:child_process`, `node:os`, and never call `setTimeout`/`setInterval`/`Date.now()`/`new Date()` without an argument. Time and I/O are injected (clock, scheduler, adapter). OS access lives only in `source/platform/**` and `source/config/store.ts`. _Why:_ pure code is tested fast and deterministically with fixtures and a fake clock.
2. **DRY, via the kit.** _Why:_ 15 agents writing UI in parallel will drift otherwise.
   - Build UI from `source/ui/kit` components.
   - Colours come only from theme tokens (`accent, accentDim, text, muted, border, ok, warn, err, bg?`) via `useTheme()` or `<T>`. Never a literal colour name or hex in a component.
   - No ad-hoc bordered `Box`: use `Panel`.
   - Before writing a helper, check `core/format.ts`, `core/duration.ts`, `core/clock-time.ts` and `ui/kit`.
   - The third time the same thing appears, extract it. Do NOT merge code that only looks alike and will change for different reasons.
3. **File size.** Aim under ~200 lines; hard ceiling 300. Split by responsibility, not arbitrarily. _Why:_ small files keep agent context cheap and reviews sharp.
4. **Never colour alone.** Focus, selection and status always carry a marker glyph (e.g. `❯`) plus bold/inverse, so `NO_COLOR` and colour-blind users still see them.
5. **Locks.** _Why:_ a leaked inhibitor keeps someone's laptop awake forever.
   - Always tie lock children to the node PID (`caffeinate -w`, `tail --pid`), so `kill -9` of node still drops the lock.
   - Never use `gnome-session-inhibit --inhibit-only`.
   - Lock children run in their own process group and release kills the group. Verified here: SIGTERM to `gnome-session-inhibit` releases the inhibitor but orphans its `tail` child, while `systemd-inhibit` takes its child down.
   - All spawning goes through `platform/spawn-lock.ts` (spawn, 300 ms settle check, `onDied`, release TERM then KILL, `releaseSync`).
6. **Honest status.** The UI shows exactly which locks are really held. Never report "awake" if the system lock is not held.

## Testing conventions

- Tests live in `test/`, mirroring `source/` (`source/core/format.ts` → `test/core/format.test.ts`), named `*.test.ts` / `*.test.tsx`. Only those match ava's `files` glob.
- Shared helpers in `test/helpers/` (`fake-adapter`, `fake-clock`, `render-themed`); fixtures (pmset output, sysfs trees) in `test/fixtures/`. Neither may be named `*.test.*`.
- Pure logic (core, parsers, steam, config merge) is written test-first.
- Component tests assert on colour-stripped frames: `stripVTControlCharacters(lastFrame() ?? '')` from `node:util`. Only theme tests assert colour.
- Time goes through the injected fake clock (`@sinonjs/fake-timers` `createClock()`). Never `FakeTimers.install()` in session/supervisor tests.
- Animated components take a `frame` prop (e.g. `CoffeeCup`) so they are tested without timers; frame 0 is the static frame.
- Terminal size is an injectable value (ink-testing-library is fixed at 100×24), so breakpoint logic is testable.
- Always `unmount()` / `cleanup()` rendered trees and dispose clocks and fake adapters.

## TypeScript and lint gotchas

- ESM only. Relative imports use `.js` even for `.tsx` (`import Panel from './Panel.js'`).
- `jsx: react-jsx`: never `import React`; import hooks by name (`import {useState} from 'react'`).
- `erasableSyntaxOnly`: no `enum`, no constructor parameter properties. Use string-literal unions and `as const` objects.
- `exactOptionalPropertyTypes`: never pass `undefined` to an optional prop; omit it (`{...(x === undefined ? {} : {x})}`).
- `noUncheckedIndexedAccess`: `arr[i]` is `T | undefined`; handle it. `noPropertyAccessFromIndexSignature`: use `obj['key']` for index signatures.
- `noUnusedLocals` / `noUnusedParameters` are on.
- xo is type-aware: `@typescript-eslint/no-unsafe-*` and `strict-boolean-expressions` (no truthiness checks on strings/numbers/nullable objects; compare explicitly).
- File names: PascalCase for components (`Panel.tsx`), kebab-case for everything else (`spawn-lock.ts`).
- Formatting: tabs, LF, `@vdemedes/prettier-config`. xo ignores `package.json` and markdown; prettier still checks markdown.

## Ink 8 API reference (verified)

Versions: ink 8.0.0, react 19.3.1, meow 14, chalk 6, TypeScript 6.0.3, ava 8.4, tsx 4, xo 5 (flat `xo.config.js`) + eslint-config-xo-react, prettier 3, ink-testing-library 4, @sinonjs/fake-timers 15, figlet 1.12 (dev). Node >= 22.

- `render(node, options)` options: `stdout, stdin, stderr, debug, exitOnCtrlC` (default true), `patchConsole` (true), `onRender, maxFps` (30), `incrementalRendering` (false), `concurrent, kittyKeyboard, interactive` (false in CI / non-TTY: only the final frame is written), `alternateScreen` (false; interactive only). Returns `{rerender, unmount, waitUntilExit, waitUntilRenderFlush, cleanup, clear}`.
- `useAnimation({interval = 100, isActive = true}) -> {frame, time, delta, reset}`; one shared timer; toggling `isActive` back on resets.
- `useWindowSize() -> {columns, rows}`.
- `useInput((input, key) => void, {isActive?})`. Key fields: `upArrow, downArrow, leftArrow, rightArrow, pageUp, pageDown, home, end, return, escape, tab, backspace, delete, ctrl, shift, meta`. With `exitOnCtrlC: false`, Ctrl+C arrives as `input === 'c' && key.ctrl`.
- `useFocus({isActive?, autoFocus?, id?}) -> {isFocused, focus}`; `useFocusManager() -> {enableFocus, disableFocus, focusNext, focusPrevious, focus(id), activeId}`.
- `useApp() -> {exit(errorOrResult?), waitUntilRenderFlush, suspendTerminal}`.
- `Box`: `backgroundColor, borderStyle, borderColor, position, overflow`. `Text` `color` / `backgroundColor`: chalk name, `#hex`, `rgb(r,g,b)` or `ansi256(n)`; an unrecognised string silently renders unstyled. Style props: `dimColor, bold, italic, underline, strikethrough, inverse, wrap`.
- ink-testing-library 4: `render(tree) -> {rerender, unmount, cleanup, stdout, stderr, stdin, frames, lastFrame}`; 100 columns × 24 rows; `stdin.write('\u001B[A')` = up, `'\r'` = return; colour is off under ava (chalk level 0).
- Global fake timers (`FakeTimers.install` faking setInterval/setTimeout/Date/performance) + `await clock.tickAsync(n)` do drive `useAnimation`; reserve this for the single animation smoke test.

## Rules for parallel agents

- You own only the files named in your brief. Do not touch anything else.
- Never edit `package.json`, `package-lock.json`, `tsconfig*.json`, `xo.config.js`, `CLAUDE.md` or `readme.md`.
- Do not add dependencies. If you need one, say so in your report and the orchestrator decides.
- Do not commit. The orchestrator commits after a green `npm test`.
- Verify with scoped commands: `npm run ava -- <your test files>`, `npx xo <your paths>`, `npx prettier --check <your paths>`, `npx tsc -p tsconfig.test.json`.
- If a contract type (`*/types.ts`, `theme/tokens.ts`) seems wrong, report it; do not change it.
- Never leave probe or scratch files in `source/` or `test/`; use the scratchpad.
- Report: files created/changed, commands run and their result, and any open questions.
