# Documentation

Reference for adopters of this starter — people forking it to build a real
site. The project root [`README.md`](../README.md) is the overview; everything
else lives here.

| Page | What it covers |
| --- | --- |
| [Getting started](./getting-started.md) | Prerequisites, creating a Sanity project, first run, reaching the Studio at `/admin`. |
| [Configuration](./configuration.md) | Every environment variable — what it does, where to get it, which are secret. |
| [Architecture](./architecture.md) | Route groups, the section registry, the schema → GROQ → TypeGen → component data flow. |
| [Sections](./sections.md) | Step-by-step for adding a page-builder section, with a full worked example. |
| [Content model](./content-model.md) | The `page`, `post`, `settings` and `redirect` document types, field by field. |
| [Links](./links.md) | The `internalDestination` system, `LINKABLE_DOCUMENTS`, `STATIC_ROUTES`, `SmartLink`. |
| [Templated pages](./templated-pages.md) | The blog routes as the worked example of a route that is not page-builder driven. |
| [Performance](./performance.md) | The rules this starter follows: projected queries, cached fetchers, image hints, and the `cacheComponents` decision. |
| [Deployment](./deployment.md) | Vercel, production environment variables, the postinstall schema deploy, other platforms. |
| [Upgrading](./upgrading.md) | How to upgrade dependencies here, plus the breaking changes already hit and worked around. |
| [Troubleshooting](./troubleshooting.md) | Common failures and their fixes. |

Contributor-facing conventions (code style, naming, JSDoc rules, the
contribution checklist) live in [`AGENTS.md`](../AGENTS.md) at the repo root.
