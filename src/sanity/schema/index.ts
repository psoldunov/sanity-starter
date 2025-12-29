import page from "@/sanity/schema/documents/base/page";
import redirect from "@/sanity/schema/documents/base/redirect";
import settings from "./documents/base/settings";
import sections from "./objects/sections";

const baseSchema = [settings, page, redirect];

const schemaTypes = [...baseSchema, ...sections];

export default schemaTypes;
