import { SettingsIcon } from "lucide-react";
import { defineType } from "sanity";

const settings = defineType({
  name: "settings",
  title: "Site Settings",
  type: "document",
  icon: SettingsIcon,
  groups: [
    {
      name: "general",
      title: "General",
    },
    {
      name: "seo",
      title: "SEO & Open Graph",
    },
  ],
  fields: [
    {
      name: "siteName",
      title: "Site Name",
      group: "general",
      type: "string",
      validation: (rule) => rule.required().error("Site Name is required"),
    },
    {
      name: "siteDescription",
      title: "Site Description",
      group: "general",
      type: "text",
      validation: (rule) =>
        rule.required().error("Site Description is required"),
    },
    {
      name: "siteOgImage",
      title: "Open Graph Image",
      type: "image",
      options: {
        accept: "image/webp, image/png, image/jpeg, image/avif",
      },
      group: "seo",
      validation: (rule) =>
        rule.required().error("Open Graph Image is required"),
    },
  ],
});

export default settings;
