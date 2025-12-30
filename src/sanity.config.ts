import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import { FilesIcon, Settings, ShuffleIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { defineConfig, type SchemaTypeDefinition } from 'sanity';
import { presentationTool } from 'sanity/presentation';
import { type StructureBuilder, structureTool } from 'sanity/structure';
import { media, mediaAssetSource } from 'sanity-plugin-media';
import { apiVersion, dataset, projectId } from '@/sanity/env';
import { locations, mainDocuments } from '@/sanity/lib/resolve';
import schemaTypes from '@/sanity/schema';

const readOnlyTypes = new Set<string>([]);

const singletonTypes = new Set<string>(['settings']);

const singletonActions = new Set<string>([
	'publish',
	'discardChanges',
	'restore',
]);

const readOnlyActions = new Set<string>(['delete']);

const singletonListItem = ({
	S,
	schemaType,
	title,
	icon,
}: {
	S: StructureBuilder;
	schemaType: string;
	title?: string;
	icon?: ComponentType;
}) =>
	S.listItem()
		.title(title || schemaType)
		.id(schemaType)
		.icon(icon || undefined)
		.child(
			S.document()
				.title(title || schemaType)
				.schemaType(schemaType)
				.id(schemaType),
		);

export default defineConfig({
	name: 'default',
	title: 'Starter Site',
	basePath: '/admin',
	projectId,
	dataset,
	apiVersion,
	ignoreBrowserTokenWarning: true,
	plugins: [
		structureTool({
			structure: (S, context) => {
				return S.list()
					.title('Sanity Dashboard')
					.items([
						singletonListItem({
							S,
							schemaType: 'settings',
							title: 'Settings',
							icon: Settings,
						}),
						S.divider(),
						orderableDocumentListDeskItem({
							title: 'Pages',
							type: 'page',
							icon: FilesIcon,
							S,
							context,
						}),
						orderableDocumentListDeskItem({
							title: 'Redirects',
							type: 'redirect',
							icon: ShuffleIcon,
							S,
							context,
						}),
					]);
			},
		}),
		media(),
		presentationTool({
			title: 'Presentation',
			resolve: {
				locations,
				mainDocuments,
			},
			previewUrl: {
				previewMode: {
					enable: '/api/draft-mode/enable',
				},
			},
		}),
	],

	form: {
		image: {
			assetSources: (previousAssetSources) => {
				return previousAssetSources.filter(
					(assetSource) => assetSource === mediaAssetSource,
				);
			},
		},
	},

	schema: {
		types: schemaTypes as SchemaTypeDefinition[],
		templates: (templates) =>
			templates.filter(
				({ schemaType }) =>
					!singletonTypes.has(schemaType) && !readOnlyTypes.has(schemaType),
			),
	},

	document: {
		actions: (input, context) => {
			if (singletonTypes.has(context.schemaType)) {
				return input.filter(
					({ action }) => action && singletonActions.has(action),
				);
			}
			if (readOnlyTypes.has(context.schemaType)) {
				return input.filter(
					({ action }) => action && readOnlyActions.has(action),
				);
			}
			return input;
		},
	},
});
