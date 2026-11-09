import Container from '@/components/layout/Container';
import Section from '@/components/utility/Section';
import type { SectionProps } from '@/types';

/**
 * Questions that open to show their answer. Each is a native `<details>`, so
 * the answers ship in the HTML for crawlers and open without JavaScript.
 *
 * @param props - The `faqSection` fields plus the section base fields.
 * @returns The FAQ section.
 */
export default function FaqSection(props: SectionProps<'faqSection'>) {
	const { heading, items } = props;

	return (
		<Section {...props}>
			<Container className='max-w-3xl'>
				{!!heading && (
					<h2 className='mb-8 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl'>
						{heading}
					</h2>
				)}
				<div className='divide-y divide-border border-y border-border'>
					{items?.map((item) => (
						<details key={item._key} className='group'>
							<summary className='flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-medium text-foreground [&::-webkit-details-marker]:hidden'>
								{item.question}
								<span
									aria-hidden='true'
									className='shrink-0 text-muted transition-transform group-open:rotate-45'
								>
									+
								</span>
							</summary>
							<p className='pb-5 whitespace-pre-line text-muted'>
								{item.answer}
							</p>
						</details>
					))}
				</div>
			</Container>
		</Section>
	);
}
