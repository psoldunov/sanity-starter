import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	images: {
		formats: ['image/avif', 'image/webp'],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.sanity.io',
			},
		],
		qualities: [75, 100],
	},
};

export default nextConfig;
