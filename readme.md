# coffee-cli

Keep your machine awake from a cosy terminal dashboard: a `caffeinate` you can see and steer.

```
                                ██████╗ ██████╗ ███████╗███████╗███████╗███████╗
                               ██╔════╝██╔═══██╗██╔════╝██╔════╝██╔════╝██╔════╝
                               ██║     ██║   ██║█████╗  █████╗  █████╗  █████╗
                               ██║     ██║   ██║██╔══╝  ██╔══╝  ██╔══╝  ██╔══╝
                               ╚██████╗╚██████╔╝██║     ██║     ███████╗███████╗
                                ╚═════╝ ╚═════╝ ╚═╝     ╚═╝     ╚══════╝╚══════╝

              '              ╭──────────────────────────────────────────────────────────────────────────╮
               ~             │ Session                                                                  │
          .     )            │ ● AWAKE                                                                  │
          (     )  '         │                                                                          │
          (    )   )         │ Elapsed  00:00:01                                                        │
           (   (   )         │ Timer    no limit                                                        │
           )   (   )         │                                                                          │
       ╭──────────────╮      │ ● System systemd-inhibit                                                 │
       │▒▒▒▒▒▒▒▒▒▒▒▒▒▒│      │ ● Display gnome-session-inhibit                                          │
       │              │──╮   ╰──────────────────────────────────────────────────────────────────────────╯
       │              │  │   ╭──────────────────────────────────────────────────────────────────────────╮
       ╰╮            ╭╯──╯   │ Stats                                                                    │
        ╰────────────╯       │ Uptime  18h 27m                                                          │
      ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀   │ Session 00:00:01                                                         │
                             │ Battery ██████████ 96%                                                   │
                             │ Power   on AC, not charging                                              │
                             │ Load    4.25 3.04 1.54                                                   │
                             │ Host    my-laptop                                                        │
                             ╰──────────────────────────────────────────────────────────────────────────╯
                             ╭──────────────────────────────────────────────────────────────────────────╮
                             │ ❯ Options                                                                │
                             │ ❯ Mode        [ ‹ indefinite › ]                                         │
                             │   Display     [ ● on ]                                                   │
                             │   AC only     [ ○ off ]                                                  │
                             │   Min battery [ off ]                                                    │
                             │   Wait PID    [ none ]                                                   │
                             ╰──────────────────────────────────────────────────────────────────────────╯

↑↓ move  ←→ change  enter edit  space pause  t theme  a animation  ? help  q quit
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

coffee-cli is not published to npm; install it from a clone. `npm link` puts `coffee-cli` on your PATH. Without it, run `node dist/cli.js`.

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

| Flag                         | Meaning                                              |
| ---------------------------- | ---------------------------------------------------- |
| `--duration`, `-d`           | Stay awake for a duration, e.g. `45m`, `1h30m`       |
| `--until`, `-u`              | Stay awake until a clock time, e.g. `17:30`          |
| `--indefinite`               | Stay awake until you quit                            |
| `--pid`, `-p`                | Stop when this process exits                         |
| `--display` / `--no-display` | Also keep the display awake (default) / system only  |
| `--ac-only`                  | Stop when the machine switches to battery            |
| `--min-battery`              | Stop when battery falls below this percentage (1-99) |
| `--theme`                    | `amber`, `green` or `severance`                      |
| `--no-animation`             | Static cup, no steam animation                       |
| `--plain`                    | No dashboard; one log line per state change          |
| `--config`                   | Use this config file instead of the default          |

Conflicting or invalid values (for example `--duration` with `--until`), unknown flags and a `--pid` that does not exist exit with code 2. Flag values apply to this session only; they are saved only if you then change that field in the app.

### Keys

| Key               | Action                                       |
| ----------------- | -------------------------------------------- |
| `↑` `↓` / `j` `k` | Move between options                         |
| `←` `→`           | Change the focused option                    |
| `Enter`           | Edit the focused option                      |
| `Esc`             | Cancel an edit                               |
| `Space`           | Pause / resume (locks released while paused) |
| `t`               | Theme picker                                 |
| `T`               | Switch to the next theme                     |
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

| Platform                      | System lock                     | Display lock                          | Status                                                              |
| ----------------------------- | ------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Linux, GNOME (Wayland)        | `systemd-inhibit` (sleep, idle) | `gnome-session-inhibit` (idle)        | Verified: run for real on Ubuntu GNOME Wayland                      |
| Linux, X11 without GNOME      | `systemd-inhibit` (sleep, idle) | `xset s off -dpms` (restored on exit) | Unit-tested only                                                    |
| Linux, other Wayland desktops | `systemd-inhibit` (sleep, idle) | unavailable (shown as such)           | System lock as GNOME; no display lock in v1                         |
| macOS                         | `caffeinate -i`                 | `caffeinate -d`                       | Implemented, unit-tested (argv, `pmset` fixtures); not run on a Mac |
| Windows / WSL                 | unsupported                     | unsupported                           | Prints an unsupported message and exits with code 1                 |

## Stop conditions

A session ends automatically when:

- the duration elapses (`--duration`) or the clock time is reached (`--until`);
- the watched process exits (`--pid`);
- the machine switches to battery (`--ac-only`) or the battery drops below the minimum (`--min-battery`);
- the system lock cannot be held.

When one fires, coffee-cli releases its locks, prints a one-line summary and exits. Battery rules are disabled, with a note, on machines without a battery. Pausing with `Space` is different: the locks are released and the cup goes cold, but the app stays open until you resume or quit.

## Exit summary and exit codes

When a session ends, coffee-cli prints one line, e.g. `coffee-cli: stayed awake for <time> — Timer finished`. The reason text is one of: Stopped by user, Timer finished, Reached the set time, Watched process exited, Switched to battery power, Battery below the minimum, Could not hold the system lock, Interrupted by a signal.

| Code  | Meaning                                                                                |
| ----- | -------------------------------------------------------------------------------------- |
| 0     | Stopped normally (quit, timer, clock time, PID exit, battery rules)                    |
| 1     | The system lock could not be held, or the platform is unsupported                      |
| 2     | Bad flags or a `--pid` that does not exist                                             |
| 128+N | Killed by signal N (for example 130 for Ctrl+C outside the dashboard, 143 for SIGTERM) |

## Small terminals

The dashboard fits itself to the terminal. Up to 90 columns wide the panels stack under the cup; from 90 columns the cup sits left of the panels. When it does not fit, it drops things in this order:

1. The big `COFFEE` heading becomes a one-line title (the art needs at least 64 columns and 35 rows).
2. Lower-priority stat lines are dropped.
3. Session and Stats sit side by side instead of stacked.
4. The cup is hidden (it needs at least 50 columns and 16 rows).
5. Session collapses to one status line, then the stats go.

Below 40 columns or 12 rows you get a single status line plus key hints. The Options panel is always kept whole.

## Configuration

Your theme and last session settings are saved automatically after you change them in the app:

- Linux: `$XDG_CONFIG_HOME/coffee-cli/config.json` (default `~/.config/coffee-cli/config.json`)
- macOS: `~/Library/Application Support/coffee-cli/config.json`
- Override with `COFFEE_CLI_CONFIG=/path/to/config.json` or `--config /path/to/config.json`

Saved: theme, session end (indefinite / duration / until), display lock, AC-only, minimum battery and animation. The watched PID is never saved. Invalid fields fall back to defaults; an unreadable file is kept aside as `config.corrupt-<timestamp>.json` and defaults are used.

## Plain mode

When stdout is not a terminal (piped or redirected), or with `--plain`, coffee-cli skips the dashboard and prints one log line per state change. Stop conditions and exit behaviour are the same.

```bash
coffee-cli -d 1h | tee awake.log
```

Example lines:

```
coffee-cli: awake — system: systemd-inhibit, display: gnome-session-inhibit
coffee-cli: stayed awake for 1h 0m 0s — Timer finished
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

## Known limitations

- `kill -9` of coffee-cli cannot restore the terminal's alternate screen (run `reset` afterwards). The locks are still dropped by the OS, because each lock child is tied to the coffee-cli process.
- The battery stop rules (`--ac-only`, `--min-battery`) have not been tested on a machine that is actually discharging; they are covered by fixtures only.
- macOS has not been run on hardware.
- The X11 `xset` display lock is unit-tested only.
- No display lock on non-GNOME Wayland desktops.

## Status

This is v1. It is built and verified on Ubuntu with GNOME on Wayland. See the platform table above for what is and is not verified elsewhere.
