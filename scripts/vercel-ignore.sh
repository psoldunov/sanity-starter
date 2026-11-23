#!/usr/bin/env sh
#
# Vercel `ignoreCommand` (see vercel.json and docs/deployment.md).
# Exit 0 skips the build; exit 1 builds. Lives here because Vercel
# caps `ignoreCommand` at 256 characters.

# No known-good commit to diff against (first deploy, or after a failed one).
if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
	exit 1
fi

# Shallow clones can miss the previous SHA; Vercel only accepts 0 and 1.
if ! git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA^{commit}" 2>/dev/null; then
	exit 1
fi

git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- . \
	':(exclude)docs/**' \
	':(exclude).github/**' \
	':(exclude).claude/**' \
	':(exclude).vscode/**' \
	':(exclude).ensemblr/**' \
	':(exclude).mcp.json' \
	':(exclude)doctor.config.json' \
	':(exclude).fallowrc.jsonc' \
	':(exclude)*.md'

if [ "$?" -eq 0 ]; then
	exit 0
fi
exit 1
