# Tailwind guidance

**Use rem for custom lengths. Built-in Tailwind utilities are always allowed, regardless of their
underlying units. Prefer existing utilities over custom values, and shared theme tokens over
repeated arbitrary values. An arbitrary value that is a scale step written the long way is drift —
convert it (rule 3).** Applies to styles you add or modify; existing violations are not precedent
for new code.

This repo uses Tailwind v4's CSS-first configuration. The whole theme is
[`src/styles/globals.css`](../../src/styles/globals.css) — there is no `tailwind.config.js` and
none should be added.

## No CSS modules

Use Tailwind for sections, layout and UI. There are no CSS modules in this repo and none should be
added. The one piece of non-Tailwind styling is `src/sanity/components/SectionPreview.tsx`, which
uses styled-components because it renders inside the Studio and the Studio is not part of the site's
cascade at all — see *Outside a utility* under rule 3. Any other exception needs explicit user
approval.

## 1. Use rem for custom lengths; keep built-in utilities

- Use `rem`, never `px`, when authoring a fixed CSS length: spacing, sizing, typography, radii,
  borders, outlines, shadows and breakpoints. This covers custom CSS, theme tokens, inline styles
  and arbitrary Tailwind values. A `px` length ignores the reader's browser font size; a `rem`
  length scales with it.
- Use built-in Tailwind utilities without unit-based restrictions, including `w-px`, `h-px`,
  borders, outlines and shadows. Do not replace them with custom rem-based tokens merely because
  Tailwind uses pixels internally.
- `px-4` is allowed: `px-` means horizontal padding, not the pixel unit. Unitless and proportional
  utilities — `w-full`, `h-dvh`, `flex-1`, `min-h-[60vh]` — remain valid. Do not turn a fluid
  layout into fixed rem sizes.

## 2. Existing utilities first

- Check Tailwind's built-ins and this repo's theme before reaching for `-[value]`. Prefer `p-4`
  over `p-[1rem]`, `gap-6` over `gap-[1.5rem]`, and `rounded-theme` over repeating `0.625rem`.
- If a built-in or existing token is visually indistinguishable from the requested value, use it.
  Do not introduce false precision, or a new token, for an imperceptible difference. Check the
  relevant breakpoints and states, and preserve functional sizing constraints and accessibility.

## 3. Token drift: converting an arbitrary value to the scale

Most `-[Xrem]` values are not genuinely arbitrary — they are scale steps written the long way.
`fallow` reports these as `css-token-drift` (severity `warn`, verdict-neutral). Convert them rather
than leaving them.

**Not every `css-token-drift` finding is drift.** The check matches any bracketed value; it cannot
tell a mis-spelled scale step from a value the scale does not contain. These are every bracketed
value in `src/` on an unmodified checkout, and only the first two are real drift:

| Flagged | Verdict |
| --- | --- |
| `aspect-[16/9]` | drift — `aspect-video` |
| `z-[9999]` | drift — `z-9999` |
| `min-h-[60vh]` | **keep** — viewport-relative, no built-in for `60vh` |
| `scale-[1.02]` | **keep** — a bare `scale-*` must be an integer (below) |
| `bg-[#C7291C]` / `bg-[#8A1D14]` | **keep** — the draft-mode banner in `src/components/utility/DisableDraftMode.tsx` is deliberately outside the site palette, so it stays a literal rather than becoming a theme token nobody else uses |

Decide per finding. A raw hex that *is* part of the design gets a `@theme` token (rule 4); one
chosen to be conspicuously not part of it does not.

### The formula

Tailwind v4 derives spacing from `--spacing`, which this repo leaves at its default `0.25rem`. So
for `p-*`, `m-*`, `gap-*`, `w`/`h`/`size`, `min-*`, `max-*` and the inset utilities
(`top`/`right`/`bottom`/`left`):

```
step = rem * 16 / 4        →  3.375rem   = 13.5   →  pt-13.5
                              30.0625rem = 120.25 →  min-h-120.25
```

Negatives take the sign on the utility, not the value: `right-[-2.375rem]` becomes `-right-9.5`.

### Two limits the compiler enforces

- **A bare spacing step must be a multiple of `0.25`.** `h-13.75` compiles; `h-13.85`, `h-13.9` and
  `h-13.9304` emit nothing at all. Equivalently: the rem value must be a whole number of pixels, a
  multiple of `0.0625rem`.
- **A bare `scale-*` value must be an integer.** `scale-57` compiles, `scale-56.9499` does not — so
  `scale-[0.569499]` either snaps to `scale-57` or stays arbitrary. This is why `scale-[1.02]` in
  `src/components/blog/PostCard.tsx` is left as it is.

A class Tailwind refuses is not a build error. It silently produces no CSS and the element loses the
style. Never ship a converted class you have not seen in compiled output.

### Non-length equivalents worth knowing

| Arbitrary | Built-in |
| --- | --- |
| `min-w-[100vw]` | `min-w-screen` |
| `aspect-[16/9]` | `aspect-video` (`--aspect-video: 16 / 9`) |
| `z-[9999]` | `z-9999` |
| `duration-[280ms]` | `duration-280` |
| `scale-[0.9]` | `scale-90` |

### Snapping an off-grid value

When the step is not a clean multiple, round to the nearest one **if the result is visually
indistinguishable** — that is rule 2, not an exception to it. `17.1953rem` → step `68.78` → `w-69`
(17.25rem, +0.875px) is fine.

Do not snap when **two distinct values would collapse into one class**. A 1px offset somebody chose
deliberately is not noise; losing it is a regression, not a cleanup. And if a file carries its own
finer grid — a transcription of a design frame at some fraction of its original scale — express the
scale once rather than snapping every value, and leave the arbitrary values until someone does.

### A named token carries more than one property

A `--text-*` token sets `line-height` (and sometimes `font-weight`) alongside `font-size`;
`text-[0.8125rem]` sets the size alone. Swapping the token in is usually right, but read the call
site first — an element with no weight utility of its own will shift. The same applies to any
`--radius-*` token with modifiers.

### Outside a utility, reference the raw variable — not the theme alias

`@theme inline` does not emit every token as a CSS variable. It emits the ones some generated
utility needs in variable form; the rest are inlined as values into the utilities that use them and
never appear as a declaration at all. Which is which depends on what the build happened to
generate, so it is not predictable from reading `globals.css`. On this repo's production build:

```bash
find .next/static -name '*.css' -exec cat {} + > /tmp/compiled.css
for v in color-background color-muted color-surface color-accent radius-theme font-sans; do
  printf '%-18s ' "--$v"
  if grep -q -- "--$v:" /tmp/compiled.css; then
    grep -o -- "--$v:[^;}]*" /tmp/compiled.css | sort -u | head -1
  else
    echo '<not emitted>'
  fi
done
# --color-background <not emitted>
# --color-muted      <not emitted>
# --color-surface    <not emitted>
# --color-accent     --color-accent:var(--accent)    ← emitted, and nothing references it
# --radius-theme     --radius-theme:var(--radius)
# --font-sans        <not emitted>
```

Concatenate first and test with `grep -q`. Piping straight into `... | head -1 || echo` reports
nothing and success on a miss, so an unemitted variable looks the same as a blank line — that idiom
is how this section got written wrong the first time.

So **hand-written CSS references the raw variable, not the theme alias**: `var(--accent)`, not
`var(--color-accent)`. The raw ones are declared in a plain `:root` block in `globals.css`, which
nothing strips — every one of them survives to the browser. A `--color-*` reference may or may not,
and when it does not, the declaration is dropped silently and the element simply loses the style.
`:focus-visible { outline: 0.125rem solid var(--accent) }` in `globals.css` is the shape to copy.

If you do reach for an alias, run the loop above against a real build and confirm it before
shipping. Do not infer it from the token being present in `@theme`.

**The Studio does not load `globals.css` at all.** `src/app/(studio)/layout.tsx` never imports it,
so under `/admin` none of these tokens exist — not the `--color-*` aliases and not the raw `:root`
ones either. Studio components run on Sanity UI's own variables, as
`src/sanity/components/SectionPreview.tsx` does with `var(--card-fg-color)`.

So **rules 1 to 4 do not govern `src/sanity/components/`.** A drift tool pointing a Studio
declaration at one of this repo's tokens is wrong, and applying the suggestion breaks the component.
The same goes for the `1px` in `SectionPreview.tsx`: Sanity UI's own idiom wins there, because the
Studio is a fixed-width editing tool rather than a page whose type scales with the reader's
browser setting.

### Finding and verifying

`fallow audit` only scans a diff. To sweep the whole repo, point `--base` at the root commit:

```bash
bunx fallow@3.22.0 audit --base "$(git rev-list --max-parents=0 HEAD)" --gate all --css-deep

bun run build   # needs the Sanity env vars; see docs/configuration.md
find .next/static -name '*.css' -exec cat {} + > /tmp/compiled.css
grep -o 'aspect-video[^{]*{[^}]*}' /tmp/compiled.css
```

Search the concatenated file rather than passing `--include='*.css'` to a recursive grep: on macOS
`grep` is often `ugrep`, which warns on that flag and can silently hand back a different result set.

A fractional step is escaped in the compiled selector, so escape it in the pattern too — a plain
`w-155\.5` matches nothing and looks like a class that failed to emit:

```bash
grep -o 'w-155\\\.5[^{]*{[^}]*}' /tmp/compiled.css
# w-155\.5{width:calc(var(--spacing) * 155.5)}
```

Variant-prefixed classes land as `.lg\:w-155\.5` and pseudo-element ones as
`.lg\:before\:top-25\.5:before`, so anchor the pattern on the utility, not on the leading `.`.

Arithmetic is not verification. Compile and compare the declarations.

## 4. Extend the theme for recurring values

- When a genuinely distinct value recurs, add a named token and replace its repeated arbitrary
  usages with the generated utility. Reuse existing tokens first; do not extend the theme for every
  one-off.
- Extend `@theme` in [`src/styles/globals.css`](../../src/styles/globals.css), following the
  existing `@theme inline` pattern: declare the raw value in `:root` and alias it in `@theme`, so
  both spellings exist and a rebrand stays an edit to one block.
- Use the right namespace and a meaningful name — a card radius that must differ from the existing
  one is `--radius-card: 0.875rem` in `@theme`, used as `rounded-card`.
- **Every non-colour token you add needs a matching entry in `extendTailwindMerge` in
  [`src/lib/utils.ts`](../../src/lib/utils.ts), in the same commit.** `tailwind-merge` only knows
  Tailwind's own scales; a token in a namespace it does not recognise produces a class it cannot
  place in a conflict group, so `cn('rounded-lg', 'rounded-theme')` returns *both* and CSS source
  order decides the winner. The merge key matches the CSS namespace: `--radius-*` → `radius`,
  `--text-*` → `text`, `--spacing-*` → `spacing`, and so on. Colours are the exception — an
  unrecognised `bg-*` / `text-*` value falls back to the colour group on its own.
  `tests/formatting/utils.test.ts` guards this; add a case there too.
- Arbitrary values are a last resort for a genuinely one-off requirement no existing utility can
  express. Fixed lengths in one must still use rem. Moving a literal into an inline style or a CSS
  variable merely to hide the brackets does not satisfy this rule.
- Arbitrary *variants* for selectors are not arbitrary values; use them when needed, preferring
  built-in variants where available.

## 5. Compose classes with cn()

- Import `cn` from `@/lib/utils` when combining base classes, conditional classes, or a caller's
  `className`. Do not use template literals, string concatenation or array joins for class
  composition.
- Use complete, statically detectable class names. Select whole classes rather than building
  fragments such as `bg-${color}-500` — Tailwind scans source text and will not generate a class it
  cannot see.
- A plain static `className="p-4 gap-6"` needs no `cn()` wrapper.

```tsx
className={cn('flex gap-6 p-4', isActive && 'bg-accent', className)}
```
