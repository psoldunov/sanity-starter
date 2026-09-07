import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// Stable in Next 16 (no longer `experimental.typedRoutes`). Type-checks every
	// `<Link href>` against the routes that actually exist, which matters in a
	// codebase whose link layer builds paths by hand from CMS data.
	typedRoutes: true,

	images: {
		formats: ['image/avif', 'image/webp'],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.sanity.io',
			},
		],
		qualities: [75, 85, 100],
	},

	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					// The embedded Studio needs to frame itself and be framed by
					// Presentation, so `X-Frame-Options: DENY` is not an option here.
					// This limits framing to the site's own origin instead.
					{
						key: 'Content-Security-Policy',
						value: "frame-ancestors 'self' https://*.sanity.studio",
					},
				],
			},
		];
	},
};

export default nextConfig;
