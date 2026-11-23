import { blocks, heading, prose } from '@/lib/markdown/format';
import type { SectionSerializer } from '@/lib/markdown/sections';

/**
 * Markdown for `faqSection`: the heading at `##`, each question at `###` with
 * its answer.
 *
 * @param section - The section, read without stega.
 * @returns The section as Markdown.
 */
const faqSectionMarkdown: SectionSerializer<'faqSection'> = (section) =>
	blocks(
		heading(2, section.heading),
		(section.items ?? []).map((item) =>
			blocks(heading(3, item.question), prose(item.answer)),
		),
	);

export default faqSectionMarkdown;
