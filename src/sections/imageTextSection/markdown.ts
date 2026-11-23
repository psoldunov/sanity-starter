import { blocks, heading, prose } from '@/lib/markdown/format';
import { sectionImage } from '@/lib/markdown/image';
import type { SectionSerializer } from '@/lib/markdown/sections';

/**
 * Markdown for `imageTextSection`: the heading at `##`, then the copy and the
 * image.
 *
 * @param section - The section, read without stega.
 * @returns The section as Markdown.
 */
const imageTextSectionMarkdown: SectionSerializer<'imageTextSection'> = (
	section,
) =>
	blocks(
		heading(2, section.heading),
		prose(section.paragraph),
		sectionImage(section.image),
	);

export default imageTextSectionMarkdown;
