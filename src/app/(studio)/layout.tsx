import type { Metadata } from 'next';
import { preloadModule } from 'react-dom';

const bridgeScript = 'https://core.sanity-cdn.com/bridge.js';

export const metadata: Metadata = {
	title: 'Sanity Dashboard',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	preloadModule(bridgeScript, { as: 'script' });
	return (
		<html lang='en'>
			<script src={bridgeScript} async type='module' />
			<body style={{ margin: '0' }}>{children}</body>
		</html>
	);
}
