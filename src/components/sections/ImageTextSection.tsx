import Container from '@/components/layout/Container';
import Section from '@/components/utility/Section';
import SmartImage from '@/components/utility/SmartImage';
import type { SectionProps } from '@/types';

export default function ImageTextSection(
	props: SectionProps<'imageTextSection'>,
) {
	const { heading, paragraph, image } = props;

	return (
		<Section {...props}>
			<Container>
				<div className='grid grid-cols-1 items-center gap-12 md:grid-cols-2'>
					{!!image && (
						<SmartImage
							image={image}
							sizes='(min-width: 768px) 50vw, 100vw'
							className='h-auto w-full rounded-theme'
						/>
					)}
					<div>
						{!!heading && (
							<h2 className='text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl'>
								{heading}
							</h2>
						)}
						{!!paragraph && (
							<p className='mt-6 whitespace-pre-line text-lg text-muted leading-relaxed'>
								{paragraph}
							</p>
						)}
					</div>
				</div>
			</Container>
		</Section>
	);
}
