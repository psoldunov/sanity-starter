import { blocks, heading, prose } from '@/lib/markdown/format';
import type { SectionSerializer } from '@/lib/markdown/sections';

/**
 * Markdown for `cardsSection`: the heading at `##`, each card at `###` with
 * its copy.
 *
 * @param section - The section, read without stega.
 * @returns The section as Markdown.
 */
const cardsSectionMarkdown: SectionSerializer<'cardsSection'> = (section) =>
	blocks(
		heading(2, section.heading),
		(section.cards ?? []).map((card) =>
			blocks(heading(3, card.heading), prose(card.paragraph)),
		),
	);

export default cardsSectionMarkdown;
