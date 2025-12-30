import type { PaddingSize } from '@/types';

export const PADDING_CONFIG: Record<
	PaddingSize,
	{
		label: string;
		classes: {
			top: string;
			bottom: string;
		};
	}
> = {
	none: {
		label: '-',
		classes: {
			top: '',
			bottom: '',
		},
	},
	small: {
		label: 'SM',
		classes: {
			top: 'pt-4 md:pt-8',
			bottom: 'pb-4 md:pb-8',
		},
	},
	medium: {
		label: 'MD',
		classes: {
			top: 'pt-8 md:pt-16',
			bottom: 'pb-8 md:pb-16',
		},
	},
	large: {
		label: 'LG',
		classes: {
			top: 'pt-12 md:pt-24',
			bottom: 'pb-12 md:pb-24',
		},
	},
	xlarge: {
		label: 'XL',
		classes: {
			top: 'pt-16 md:pt-32',
			bottom: 'pb-16 md:pb-32',
		},
	},
};

export const PROTECTED_ROUTE_PATTERNS = ['/api/*', '/admin/*'];
