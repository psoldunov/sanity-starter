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
([`scripts/postinstall.sh`](../scripts/postinstall.sh)) runs `bun run typegen`
after the install. On a fresh project that has no `.env.local` yet,
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

`predev` runs `bun run typegen` first, so every dev start regenerates
`schema.json` and `src/sanity/types/sanity.types.ts` from the current schema.
Both are gitignored build artefacts — never edit them by hand.

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
   - `sanity schema extract --path=./schema.json --enforce-required-fields --force`
     serialises the Studio schema to `schema.json`.
   - `sanity typegen generate` reads that file plus every `defineQuery()` call
     under `src/` and writes `src/sanity/types/sanity.types.ts`.
2. `next dev` starts Next 16, serving the public site from the `(site)` route
   group and the embedded Studio from the `(studio)` group at `/admin`.

Because typegen is a prestep of both `dev` and `build`, generated types can never
drift from the schema in normal use. If you edit a schema file while the dev
server is running, re-run `bun run typegen` to refresh the types.

## Commands

| Command | What it does |
| --- | --- |
| `bun dev` | Dev server (site and Studio), typegen first. |
| `bun run build` | Production build, typegen first. |
| `bun start` | Serve the production build. |
| `bun run typegen` | Extract schema and regenerate types. |
| `bun run typegen:extract` / `bun run typegen:generate` | The two typegen steps individually. |
| `bun run lint` | Biome check. |
| `bun run lint:fix` | Biome check with safe fixes applied. |
| `bun run format` | Biome formatter. |
| `bun run typecheck` | `tsc --noEmit`. |
| `bun test` | Unit tests (Bun's runner). |
| `bun run test:coverage` | Tests with a coverage report. |
| `bun run check` | Lint, then typecheck, then test — run this before pushing. |

## Next

- [Architecture](./architecture.md) — how the pieces fit together.
- [Sections](./sections.md) — add your first page-builder section.
- [Deployment](./deployment.md) — ship it.
