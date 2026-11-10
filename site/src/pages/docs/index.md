---
layout: ../../layouts/DocsLayout.astro
title: Getting started
description: Keep your machine awake from a cosy terminal dashboard. Install from source and start your first session.
---

coffee-cli is a visible, steerable alternative to `caffeinate`. It starts keeping your machine awake as soon as it launches, shows the locks it holds, and lets you change your session live.

## Requirements

- **Node.js 22.22.2 or newer.** For development tooling, use Node 22.22.2+ or 24.15+; earlier releases in those lines can show dependency engine warnings.
- **Linux or macOS.** Windows and WSL are unsupported.
- **Git and npm** to install from source.

Ubuntu with GNOME on Wayland is verified on hardware. macOS and the Linux X11 display path are unit-tested only. See [platform support](./platforms/) before relying on a particular display lock.

## Install from source

coffee-cli is **not published to npm**. Clone the project and run it locally:

```bash
git clone https://github.com/areimel/coffee-cli.git
cd coffee-cli
npm install
npm run dev
```

The dashboard opens with your saved settings, or defaults: no time limit, system and display locks enabled, amber theme, animated steam, and no battery stop rules.

## Add the command to your PATH

From the cloned project:

```bash
npm run build
npm link
coffee-cli
```

`npm link` needs a writable npm prefix and may require elevated permissions depending on your setup. You can also run the built app from the project directory without linking:

```bash
npm start
# Or:
node dist/cli.js
```

## Your first timed session

Pass CLI flags after `--` when using the npm development command:

```bash
npm run dev -- --duration 45m
```

With the linked command:

```bash
coffee-cli --duration 45m
```

Use the arrow keys to move through and change options. Press `Enter` to edit a field, `Space` to pause or resume, and `q` to quit. Pausing releases the locks while keeping the dashboard open. Quitting releases the locks and prints a one-line summary.

## Next steps

Read [usage](./usage/) for session recipes, [reference](./reference/) for every flag and key, or [configuration](./configuration/) for saved settings and themes.
