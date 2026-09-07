#!/usr/bin/env sh
#
# Runs after every `bun install`.
#
# 1. On Vercel production only: deploy the Studio schema and extract the manifest
#    so the Sanity Dashboard, Canvas and Agent Actions can discover this studio.
# 2. Always: regenerate the local TypeGen artefacts (`schema.json` and
#    `src/sanity/types/sanity.types.ts`), which are gitignored and therefore
#    absent on a fresh clone.
#
# Step 2 is best-effort on purpose. A fresh clone has no `.env.local` yet, and an
# install that hard-fails before the developer has had a chance to write one is a
# terrible first impression. We print what to do instead and exit 0.

set -e

if [ "$VERCEL_ENV" = "production" ]; then
	sanity schema deploy && sanity manifest extract --path public/admin/static
fi

if [ "$SKIP_SANITY_TYPEGEN" = "1" ]; then
	echo "postinstall: SKIP_SANITY_TYPEGEN=1 — skipping Sanity type generation."
	exit 0
fi

if bun run typegen; then
	exit 0
fi

cat <<'EOF'

  ────────────────────────────────────────────────────────────────────────
  Sanity type generation did not complete.

  This is expected on a fresh clone before you have configured the project.
  Dependencies installed fine — nothing is broken.

  Next:
    1. cp .env.example .env.local
    2. Fill in NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET
       and NEXT_PUBLIC_SANITY_API_VERSION
    3. bun run typegen

  `bun dev` and `bun run build` both run typegen first, so step 3 is
  usually unnecessary — it is here for when you want to check it in isolation.
  ────────────────────────────────────────────────────────────────────────

EOF

exit 0
