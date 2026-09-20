# Vendored agent skills

Both skills here are **verbatim upstream copies**. Nothing in them is written for this repository,
and nothing in them should be hand-edited — a local edit makes the copy diverge silently and the
next refresh will clobber it. To change behaviour, write a rule in
[`.agents/rules/`](../rules) instead.

`.claude/skills/` holds symlinks into this directory so Claude Code's skill discovery finds them,
and `.claude/rules` symlinks to [`../rules`](../rules) for the same reason. `.agents/` is the
canonical location; other agents read it directly.

| Skill | Upstream | Vendored version |
| --- | --- | --- |
| `chrome-devtools` | [`chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp) (npm), `skills/chrome-devtools/` | `1.9.0` — the version [`.mcp.json`](../../.mcp.json) pins |
| `playwright-cli` | [`@playwright/cli`](https://www.npmjs.com/package/@playwright/cli) (npm), `skills/playwright-cli/` | `0.1.21` |

## Refreshing

Remove the destination first — `cp -R src dest/` nests a second copy inside an existing `dest/src`
rather than replacing it.

```bash
# chrome-devtools — keep the version in step with .mcp.json
V=1.9.0
rm -rf /tmp/skillsrc && mkdir -p /tmp/skillsrc
curl -sL "$(npm view chrome-devtools-mcp@$V dist.tarball)" | tar -xz -C /tmp/skillsrc
rm -rf .agents/skills/chrome-devtools
cp -R /tmp/skillsrc/package/skills/chrome-devtools .agents/skills/

# playwright-cli — the binary comes from @playwright/cli
rm -rf /tmp/skillsrc && mkdir -p /tmp/skillsrc
curl -sL "$(npm view @playwright/cli dist.tarball)" | tar -xz -C /tmp/skillsrc
rm -rf .agents/skills/playwright-cli
cp -R /tmp/skillsrc/package/skills/playwright-cli .agents/skills/
```

Then `git diff` — the whole point of keeping these byte-identical is that the diff shows exactly
what upstream changed. Update the version column above in the same commit.

## Notes

- `playwright-cli` needs the `playwright-cli` binary on `PATH`, from `@playwright/cli`. The npm
  package plainly named `playwright-cli` is **deprecated**; do not install that one.
- Its output directory `.playwright-cli/` is gitignored — it can contain session credentials.
- `chrome-devtools-mcp` is already configured in [`.mcp.json`](../../.mcp.json), pinned rather than
  `@latest` so an upstream release cannot change tool behaviour mid-task.
- Upstream `chrome-devtools-mcp` also ships `a11y-debugging`, `debug-optimize-lcp`,
  `memory-leak-debugging` and `chrome-devtools-cli`. The first two line up with the Core Web Vitals
  gate in [`.agents/rules/ssr.md`](../rules/ssr.md) and are worth vendoring the same way if you want
  them; they are deliberately not included yet.
