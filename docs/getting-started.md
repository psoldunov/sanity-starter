# Getting started

From nothing to a running site with an editable Studio.

## Prerequisites

- **Bun 1.4.2 or newer.** This project is Bun-only — it uses `bun test` as its
  test runner and `bun run` for every script. Do not introduce npm or yarn
  commands. The exact version is pinned in [`mise.toml`](../mise.toml); if you
  use [mise](https://mise.jdx.dev), `mise install` sets up Bun and Biome for you.
- **Node.js 22.12 or newer.** Declared in `engines` in
  [`package.json`](../package.json). Next and the Sanity CLI both need it even
  though Bun drives the scripts.
- **A Sanity account.** Free at [sanity.io](https://www.sanity.io/).

## 1. Create a Sanity project

Sign in at [sanity.io/manage](https://www.sanity.io/manage) and create a
project. Note two values from the project page:

- the **project ID** (an eight-character string such as `a1b2c3d4`)
- the **dataset** name — `production` unless you chose otherwise

You can also do this from the CLI once dependencies are installed:

```bash
bunx sanity login
bunx sanity init --create-project "My Site" --dataset production
```

## 2. Get the code

```bash
bun create psoldunov/sanity-starter my-site
cd my-site
```

`bun create` scaffolds the project from the starter and installs dependencies in
one step.

If you are contributing to the starter itself rather than building a site on it,
clone instead and install by hand:

```bash
git clone https://github.com/psoldunov/sanity-starter.git
cd sanity-starter
bun install
```

Either way, `postinstall`
([`scripts/postinstall.sh`](../scripts/postinstall.sh)) runs
`bun run sections:gen`, then `bun run typegen`, after the install. On a fresh project that has no `.env.local` yet,
type generation cannot reach your project and prints instructions instead of
failing the install — that is expected, and nothing is broken. Set the
environment up (next step) and it will succeed from then on.

## 3. Configure the environment

```bash
cp .env.example .env.local
```

Fill in at minimum:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID="a1b2c3d4"
NEXT_PUBLIC_SANITY_DATASET="production"
```

Add `SANITY_API_READ_TOKEN` if you want draft mode and live preview locally.
Every variable is documented in [configuration](./configuration.md) — including
which ones are secret and must never carry a `NEXT_PUBLIC_` prefix.

## 4. Run the dev server

```bash
bun dev
```

- Site: <http://localhost:3000>
- Studio: <http://localhost:3000/admin>

`predev` runs `bun run typegen` first, which runs `bun run sections:gen` and then
regenerates `schema.json` and `src/sanity/types/sanity.types.ts` from the
current schema. These files, and the `src/sections/*.generated.ts` registries,
are gitignored build artefacts. Never edit them by hand.

## 5. Create your first content

The site reads everything from Sanity, so a brand-new dataset renders nothing
until you add content. In the Studio at `/admin`:

1. Open **Settings** and fill in the site name, description and Open Graph
   image. All three are required, and the header and footer read from here.
2. Create a **Page** with route `/`. A page needs at least one section — add a
   Hero Section and fill it in.
3. Publish, then reload <http://localhost:3000>.

The document types and their fields are described in
[content model](./content-model.md).

## What `bun dev` actually does

1. `predev` → `bun run typegen`
   - `bun run sections:gen` scans `src/sections/*/` and writes the section
     registries (`src/sections/*.generated.ts`) that the schema, `PAGE_QUERY`
     and `SectionRenderer` import.
   - `sanity schema extract --path=./schema.json --enforce-required-fields --force`
     serialises the Studio schema to `schema.json`.
   - `sanity typegen generate` reads that file plus every `defineQuery()` call
     under `src/` and writes `src/sanity/types/sanity.types.ts`.
2. `next dev` starts Next 16, serving the public site from the `(site)` route
   group and the embedded Studio from the `(studio)` group at `/admin`.

Because typegen is a prestep of both `dev` and `build`, generated types can never
drift from the schema in normal use. If you edit a schema file or add a section
folder while the dev server is running, re-run `bun run typegen` to refresh the
registries and types.

## Agent tooling (optional, delete it if you do not want it)

Two files exist only for AI coding agents and have no effect on the site:

- [`.mcp.json`](../.mcp.json) registers the [Chrome DevTools MCP
  server](https://github.com/ChromeDevTools/chrome-devtools-mcp), so an agent
  can drive a headless browser against your dev server to check a change it
  made. The version is pinned rather than `@latest` — it is executed via `npx`,
  so pin it deliberately when you bump it. Editors that support project-scoped
  MCP servers ask before starting it. Delete the file to opt out.
- `public/.well-known/appspecific/com.chrome.devtools.json` returns `{}` so the
  probe Chrome DevTools makes for its automatic-workspace-folders feature gets
  a 200 instead of filling the dev log with 404s. It is served in production
  too, at three bytes.

Agent conventions themselves live in [`AGENTS.md`](../AGENTS.md) and
[`.agents/rules/`](../.agents/rules/) — docs, SSR, Tailwind and testing. The
skills an agent can use are vendored in [`.agents/skills/`](../.agents/skills/).
`.agents/` is the canonical location for both; `.claude/rules` and the entries
under `.claude/skills/` are symlinks into it, so Claude Code discovers them
without a second copy to keep in step.

## Commands

| Command | What it does |
| --- | --- |
| `bun dev` | Dev server (site and Studio), typegen first. |
| `bun run build` | Production build, typegen first. |
| `bun start` | Serve the production build. |
| `bun run sections:gen` | Scan `src/sections/*/` and write the section registries. |
| `bun run typegen` | `sections:gen`, then extract the schema and regenerate types. |
| `bun run typegen:extract` / `bun run typegen:generate` | The two typegen steps individually. |
| `bun run lint` | Biome check. |
| `bun run lint:fix` | Biome check with safe fixes applied. |
| `bun run format` | Biome formatter. |
| `bun run typecheck` | `sections:gen`, `next typegen`, then `tsc --noEmit`. |
| `bun test` | Unit tests (Bun's runner). Skips `tests/e2e/`. |
| `bun run test:coverage` | Tests with a coverage report. |
| `bun run test:e2e` | Playwright specs in `tests/e2e/` (Chromium). Start `bun dev` first. |
| `bun run check` | Lint, then typecheck, then test — run this before pushing. |

## Testing

Unit tests are small on purpose: pure functions in `src/lib/` whose wrong answer
is silent and touches security, SEO or routing. Nothing asserts on rendered
appearance; you check that by opening the page.

Complex functionality is the exception and gets a checked-in Playwright spec in
`tests/e2e/`: forms with validation or submission, search, filters, multi-step
flows, anything that sends data. [`playwright.config.ts`](../playwright.config.ts)
runs Chromium against `E2E_BASE_URL`, or `http://localhost:$PORT` (3000 by
default). It does not start a server, so run `bun dev` in another terminal first.
On NixOS, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to a system Chrome (`command -v google-chrome-stable`).
`bun run test:e2e` passes when there are no specs, which is the state of a fresh
starter. [`bunfig.toml`](../bunfig.toml) keeps `bun test` out of `tests/e2e/`.

## Next

- [Architecture](./architecture.md) — how the pieces fit together.
- [Sections](./sections.md) — add your first page-builder section.
- [Deployment](./deployment.md) — ship it.
