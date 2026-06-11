# WebObsidian 🔮

A self-hosted, **Obsidian-compatible web app**. Point it at a folder of Markdown
files and edit your "second brain" from any browser — with full-text search,
GitHub sync (incl. Git LFS), an API for AI agents, and community-plugin support.

> Design: [PRD.md](PRD.md) · Progress: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

## Features

- 📝 **Editor & preview** — CodeMirror 6, live/source/reading views, wikilinks
  `[[...]]`, embeds `![[...]]`, tags `#tag`, callouts, task lists, backlinks,
  outline and an interactive **graph view**.
- 🔍 **QMD search** — fast full-text + fielded search (`tag:`, `path:`, `title:`),
  fuzzy + prefix, incremental indexing, persisted to disk.
- 🔄 **GitHub sync** — native `git` pull/commit/push with **Git LFS** for large
  files, optional auto-sync.
- 🔐 **Login gate** — a single master password (scrypt-hashed) protects everything.
- 🧩 **Community plugins** — install Obsidian plugins from GitHub; loaded against
  an Obsidian-API compatibility shim.
- 🤖 **Agent API** — scoped API keys let AI agents read/write/search the vault via
  REST (`/api/v1`). See [docs/AGENT_API.md](docs/AGENT_API.md).
- 🗃️ **Pure-JSON config** — all settings live in `data/settings.json`. No database.
- 🐳 **Docker** — one command to run the whole stack.

## Quick start (Docker)

```bash
git clone https://github.com/xnohat/webobsidian.git
cd webobsidian
cp .env.example .env        # edit VAULT_HOST_PATH, set WEBOBSIDIAN_PASSWORD
docker compose up -d --build
# open http://localhost:8787
```

Out of the box it serves the bundled `./sample-vault`. All deployment settings live
in **`.env`** (git-ignored) — you never edit the tracked `docker-compose.yml`, so a
`git pull` / redeploy keeps your config and vault mapping intact. On first load you'll
set the master password (if not seeded via `WEBOBSIDIAN_PASSWORD`).

### Deploy to a VPS

1. Put your vault on the host — copy a folder, or `git clone` it (Git LFS is supported
   for attachments). The directory must exist before starting.
2. In `.env` set `VAULT_HOST_PATH=/abs/path/to/vault` and a strong
   `WEBOBSIDIAN_PASSWORD`. To run behind a reverse proxy, set `HTTP_BIND=127.0.0.1`.
3. `docker compose up -d --build`.

**Large vaults & file watching.** A fresh VPS ships a low
`fs.inotify.max_user_watches` (often 8192), which a big vault exceeds. WebObsidian
auto-detects this and falls back to **polling** (works anywhere, more CPU). For lower
CPU, raise the kernel limit instead and keep native watching:

```bash
sudo sysctl -w fs.inotify.max_user_watches=524288
echo 'fs.inotify.max_user_watches=524288' | sudo tee -a /etc/sysctl.conf
```

## Local development

```bash
npm install
npm run dev          # server :8787 + web dev server :5173 (proxied)
# open http://localhost:5173
```

Production build (server serves the built SPA):

```bash
npm run build
VAULT_PATH=./sample-vault npm start
# open http://localhost:8787
```

## Configuration (env)

**Docker (`.env`, consumed by `docker-compose.yml`):**

| Var | Default | Description |
|-----|---------|-------------|
| `VAULT_HOST_PATH` | `./sample-vault` | Host path bind-mounted to `/vault` |
| `HTTP_BIND` | `0.0.0.0` | Host interface to publish on (`127.0.0.1` = local only) |
| `HTTP_PORT` | `8787` | Host port mapped to container `8787` |
| `WEBOBSIDIAN_PASSWORD` | – | Seed the master password on first run |
| `WEBOBSIDIAN_WATCH` | `auto` | `auto` (native + polling fallback) or `polling` |

**App-level (read by the server, set inside the container by Docker):**

| Var | Default | Description |
|-----|---------|-------------|
| `PORT` | `8787` | HTTP port |
| `VAULT_PATH` | `./sample-vault` | Path to the notes vault |
| `DATA_DIR` | `./data` | Where `settings.json` + search index live |
| `ALLOWED_ROOTS` | – | Comma-separated roots the vault picker may browse |
| `WEBOBSIDIAN_PASSWORD` | – | Seed the master password on first run |
| `WEBOBSIDIAN_WATCH` | `auto` | File-watch mode: `auto` or `polling` |
| `NODE_OPTIONS` | `--max-old-space-size=4096` (Docker) | Node heap size — raise for large vaults |

Everything else (git remote/token, API keys, plugins, theme) is configured in the
**Settings** UI and stored in `data/settings.json`.

### Large vaults & memory

The search index (QMD) and link graph are kept in memory, so memory use scales with
the number of markdown files. Node's default heap (~2 GB) is enough for a few thousand
notes, but a large vault (e.g. ~6k+ notes / multi-GB) can exhaust it and crash with
`FATAL ERROR: … heap out of memory`. Raise the heap:

```bash
NODE_OPTIONS=--max-old-space-size=4096 npm start   # 4 GB; use 8192 for very large vaults
```

The Docker image already sets `NODE_OPTIONS=--max-old-space-size=4096` (override it in
`docker-compose.yml` if needed). The server also indexes incrementally, caps very large
note bodies, and debounces re-indexing to keep peak memory bounded.

## Architecture

See [PRD.md §2](PRD.md). Monorepo: `server/` (Express + TS API) and `web/`
(React + Vite SPA, built into `server/public`).

## License

MIT
