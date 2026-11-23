import page from '@/sanity/schema/documents/base/page';
import redirect from '@/sanity/schema/documents/base/redirect';
import { sectionTypes } from '@/sections/schemas.generated';
import settings from './documents/base/settings';
import post from './documents/post';
import { geo } from './objects/geo';
import { internalDestination } from './objects/internalDestination';
import { link, linkWithLabel } from './objects/link';

const baseSchema = [settings, page, redirect];

const schemaTypes = [
	...baseSchema,
	...sectionTypes,
	link,
	linkWithLabel,
	internalDestination,
	geo,
	post,
];

export default schemaTypes;
