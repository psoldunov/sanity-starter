import { blocks, heading, prose } from '@/lib/markdown/format';
import { sectionImage } from '@/lib/markdown/image';
import type { SectionSerializer } from '@/lib/markdown/sections';

/**
 * Markdown for `heroSection`: its heading is the page's `#`, then the copy and
 * the image.
 *
 * @param section - The section, read without stega.
 * @returns The section as Markdown.
 */
const heroSectionMarkdown: SectionSerializer<'heroSection'> = (section) =>
	blocks(
		heading(1, section.heading),
		prose(section.paragraph),
		sectionImage(section.image),
	);

export default heroSectionMarkdown;
