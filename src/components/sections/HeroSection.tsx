import Container from '@/components/layout/Container';
import Section from '@/components/utility/Section';
import SmartImage from '@/components/utility/SmartImage';
import type { SectionProps } from '@/types';

export default function HeroSection(
	props: SectionProps<'heroSection'> & { isFirstSection?: boolean },
) {
	const { heading, paragraph, image, isFirstSection } = props;

	return (
		<Section {...props}>
			<Container>
				<div className='grid grid-cols-1 items-center gap-12 md:grid-cols-2'>
					<div>
						{!!heading && (
							<h1 className='text-balance font-semibold text-4xl text-foreground tracking-tight sm:text-5xl'>
								{heading}
							</h1>
						)}
						{!!paragraph && (
							<p className='mt-6 whitespace-pre-line text-lg text-muted leading-relaxed'>
								{paragraph}
							</p>
						)}
					</div>
					{!!image && (
						<SmartImage
							image={image}
							// Preloaded from `<head>` rather than discovered in the body,
							// but only as the page's first section — nothing stops an
							// editor placing several heroes, and preloading each one's
							// image prioritises none of them. `sizes` stops the browser
							// fetching the widest srcset candidate on a phone.
							preload={isFirstSection}
							sizes='(min-width: 768px) 50vw, 100vw'
							className='h-auto w-full rounded-theme'
						/>
					)}
				</div>
			</Container>
		</Section>
	);
}
