import { defineCliConfig } from 'sanity/cli';
import { dataset, projectId } from '@/sanity/env';

export default defineCliConfig({
	api: {
		projectId: projectId,
		dataset: dataset,
	},
	autoUpdates: true,
	typegen: {
		path: './src/**/*.{ts,tsx}',
		schema: './schema.json',
		generates: './src/sanity/types/sanity.types.ts',
		overloadClientMethods: true,
	},
});
