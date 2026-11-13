#!/usr/bin/env sh
#
# Vercel `ignoreCommand` (see vercel.json and docs/deployment.md).
# Exit 0 skips the build; any other exit builds. Lives here because Vercel
# caps `ignoreCommand` at 256 characters.

# No known-good commit to diff against (first deploy, or after a failed one).
if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
	exit 1
fi

# Exits 1 on changes and 128 if the SHA is missing from the clone: both build.
exec git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- . \
	':(exclude)docs/**' \
	':(exclude).github/**' \
	':(exclude).claude/**' \
	':(exclude).vscode/**' \
	':(exclude).ensemblr/**' \
	':(exclude).mcp.json' \
	':(exclude)doctor.config.json' \
	':(exclude).fallowrc.jsonc' \
	':(exclude)*.md'
