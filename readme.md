# coffee-cli

Keep your machine awake from a cosy terminal dashboard: a `caffeinate` you can see and steer.

```
 ██████╗ ██████╗ ███████╗███████╗███████╗███████╗
██╔════╝██╔═══██╗██╔════╝██╔════╝██╔════╝██╔════╝
██║     ██║   ██║█████╗  █████╗  █████╗  █████╗
██║     ██║   ██║██╔══╝  ██╔══╝  ██╔══╝  ██╔══╝
╚██████╗╚██████╔╝██║     ██║     ███████╗███████╗
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝     ╚══════╝╚══════╝

                     ┌ Session ──────────────────────────────────────┐
       (  )  (       │ ● AWAKE      system ✓ held   display ✓ held   │
        )  (  )      │ Ends at 17:30   (1h 12m remaining)            │
       (  )  (       └───────────────────────────────────────────────┘
    .-----------.    ┌ Stats ────────────────────────────────────────┐
    |           |-.  │ Uptime        3d 4h        Session    18m     │
    |           | |  │ Battery  82%  ████████░░  on AC, charging     │
    |           |-'  │ Load          0.42 0.38 0.35                  │
    '-----------'    └───────────────────────────────────────────────┘
   `-------------'   ┌ Options ──────────────────────────────────────┐
                     │ ❯ End           until 17:30                   │
                     │   Display       keep awake                    │
                     │   AC only       off                           │
                     │   Min battery   20%                           │
                     │   Wait on PID   —                             │
                     └───────────────────────────────────────────────┘
 ↑↓ move  ←→ change  enter edit  space pause  t themes  a animation  ? help  q quit
```

## What it does

- Starts keeping the machine awake the moment it launches, using your saved (or default) settings.
- Lets you change every option live in the Options panel instead of remembering flags.
- Shows honestly which locks are held: the system lock (no sleep) and the display lock (screen stays on).
- Shows live stats: uptime, session elapsed, time remaining or end time, battery level and charging state, AC or battery, time to empty/full, load average, and which lock mechanism is in use.
- Stops automatically when a stop condition fires, releases the locks, and exits with a one-line summary.

## Requirements

- Node.js >= 22
- Linux or macOS (Windows and WSL are not supported and say so)

## Install and run from source

```bash
npm install
npm run build
npm link
coffee-cli
```

`npm link` puts `coffee-cli` on your PATH. Without it, run `node dist/cli.js`.

## Usage

```bash
coffee-cli                     # stay awake indefinitely (or with your saved settings)
coffee-cli -d 1h30m            # stay awake for 1 hour 30 minutes
coffee-cli -u 17:30            # stay awake until 17:30
coffee-cli -p 4242             # stay awake until process 4242 exits
coffee-cli --no-display        # keep the system awake but let the screen sleep
coffee-cli --ac-only --min-battery 20
coffee-cli --theme severance
coffee-cli -d 2h --plain &     # no dashboard; log lines only, good for scripts
```

### Flags

| Flag                         | Meaning                                             |
| ---------------------------- | --------------------------------------------------- |
| `--duration`, `-d`           | Stay awake for a duration, e.g. `45m`, `1h30m`      |
| `--until`, `-u`              | Stay awake until a clock time, e.g. `17:30`         |
| `--indefinite`               | Stay awake until you quit                           |
| `--pid`, `-p`                | Stop when this process exits                        |
| `--display` / `--no-display` | Also keep the display awake (default) / system only |
| `--ac-only`                  | Stop when the machine switches to battery           |
| `--min-battery`              | Stop when battery falls below this percentage       |
| `--theme`                    | `amber`, `green` or `severance`                     |
| `--no-animation`             | Static cup, no steam animation                      |
| `--plain`                    | Force plain (non-TTY) mode                          |
| `--config`                   | Use this config file instead of the default         |

Conflicting or invalid values (for example `--duration` with `--until`) exit with code 2. Flag values apply to this session only; they are saved only if you then change that field in the app.

### Keys

| Key               | Action                                       |
| ----------------- | -------------------------------------------- |
| `↑` `↓` / `j` `k` | Move between options                         |
| `←` `→`           | Change the focused option                    |
| `Enter`           | Edit the focused option                      |
| `Esc`             | Cancel an edit                               |
| `Space`           | Pause / resume (locks released while paused) |
| `t`               | Theme picker                                 |
| `a`               | Toggle animation                             |
| `?`               | Help                                         |
| `q` / `Ctrl+C`    | Quit (locks released)                        |

## Themes

- **Amber**: warm amber phosphor.
- **Green**: classic green phosphor.
- **Severance**: cool blue on deep navy.

Themes adapt to your terminal's colour support (truecolor, 256, 16). With `NO_COLOR` set, focus and status are still shown with markers, bold and inverse text.

## What "awake" means

coffee-cli holds up to two locks, and the dashboard shows each one separately:

- **System lock**: the machine does not idle-sleep.
- **Display lock**: the screen does not blank or lock.

If the display lock is unavailable, the session shows as degraded but the system stays awake. If the system lock cannot be held, the session stops with the error rather than pretending to be awake. Every lock is tied to the coffee-cli process, so the OS releases it even if coffee-cli is killed.

| Platform                      | System lock                     | Display lock                          |
| ----------------------------- | ------------------------------- | ------------------------------------- |
| macOS                         | `caffeinate -i`                 | `caffeinate -d`                       |
| Linux, GNOME                  | `systemd-inhibit` (sleep, idle) | `gnome-session-inhibit` (idle)        |
| Linux, X11 without GNOME      | `systemd-inhibit` (sleep, idle) | `xset s off -dpms` (restored on exit) |
| Linux, other Wayland desktops | `systemd-inhibit` (sleep, idle) | unavailable (shown as such)           |
| Windows / WSL                 | unsupported                     | unsupported                           |

## Stop conditions

A session ends automatically when:

- the duration elapses (`--duration`) or the clock time is reached (`--until`);
- the watched process exits (`--pid`);
- the machine switches to battery (`--ac-only`) or the battery drops below the minimum (`--min-battery`);
- the system lock cannot be held.

When one fires, coffee-cli releases its locks, prints a one-line summary and exits. Battery rules are disabled, with a note, on machines without a battery. Pausing with `Space` is different: the locks are released and the cup goes cold, but the app stays open until you resume or quit.

## Configuration

Your theme and last session settings are saved automatically after you change them in the app:

- Linux: `$XDG_CONFIG_HOME/coffee-cli/config.json` (default `~/.config/coffee-cli/config.json`)
- macOS: `~/Library/Application Support/coffee-cli/config.json`
- Override with `COFFEE_CLI_CONFIG=/path/to/config.json` or `--config /path/to/config.json`

Saved: theme, session end (indefinite / duration / until), display lock, AC-only, minimum battery and animation. The watched PID is never saved. Invalid fields fall back to defaults; an unreadable file is kept aside as `config.corrupt-<timestamp>.json` and defaults are used.

## Plain mode

When output is not a terminal (piped, redirected or backgrounded), or with `--plain`, coffee-cli skips the dashboard and prints one log line per state change. Stop conditions and exit behaviour are the same.

```bash
coffee-cli -d 1h | tee awake.log
```

## Development

| Command                                 | What it does                                        |
| --------------------------------------- | --------------------------------------------------- |
| `npm run build`                         | Compile `source/` to `dist/`                        |
| `npm run dev`                           | Compile in watch mode                               |
| `npm test`                              | Prettier check, xo lint, type-check, then ava tests |
| `npm run ava -- test/path/file.test.ts` | Run one test file                                   |
| `npx xo --fix`                          | Lint and auto-fix                                   |
| `npx tsc -p tsconfig.test.json`         | Type-check source, tests and scripts                |

Contributor and agent conventions are in [CLAUDE.md](CLAUDE.md); the design is in [docs/superpowers/specs](docs/superpowers/specs/2026-11-09-coffee-cli-design.md).

## Status

This is v1, in development. Linux (GNOME on Wayland) is the platform it is built and verified on. macOS support is covered by tests only and has not yet been run on real hardware.
