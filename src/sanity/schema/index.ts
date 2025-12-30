import page from '@/sanity/schema/documents/base/page';
import redirect from '@/sanity/schema/documents/base/redirect';
import settings from './documents/base/settings';
import post from './documents/post';
import sections from './objects/sections';

const baseSchema = [settings, page, redirect];

const schemaTypes = [...baseSchema, ...sections, post];

export default schemaTypes;
