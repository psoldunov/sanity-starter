import { defineCliConfig } from 'sanity/cli';
import { dataset, projectId } from '@/sanity/env';

export default defineCliConfig({
	api: {
		projectId,
		dataset,
	},
	autoUpdates: true,
	typegen: {
		path: './src/**/*.{ts,tsx}',
		schema: './schema.json',
		generates: './src/sanity/types/sanity.types.ts',
		overloadClientMethods: true,
	},
	/**
	 * `sanity schema extract` loads `sanity.config.ts` inside a Vite SSR worker
	 * configured with `ssr.noExternal: true`, which forces every dependency —
	 * CommonJS ones included — through the ESM transform. Two transitive
	 * dependencies of `@sanity/orderable-document-list` are plain CJS with no
	 * `exports` map, so bundling them produces `Error: exports is not defined`
	 * and schema extraction (and therefore `bun run typegen`) fails.
	 *
	 * `ssr.external` takes precedence over `ssr.noExternal`, so listing them here
	 * leaves them to Node's own CJS loader, which handles them correctly.
	 *
	 * Only CLI commands read this config — the Next build bundles the embedded
	 * Studio itself and is unaffected. Remove this once the upstream packages
	 * ship ESM builds.
	 */
	vite: (config) => ({
		...config,
		ssr: {
			...config.ssr,
			external: [
				...(Array.isArray(config.ssr?.external) ? config.ssr.external : []),
				'lexorank',
				'@hello-pangea/dnd',
			],
		},
	}),
});
