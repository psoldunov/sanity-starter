'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

/**
 * Whether the page is the top-level window — not in an iframe and not opened by
 * another window.
 *
 * Returns `false` during SSR and until hydration, so anything gated on it is
 * absent from the server-rendered HTML rather than mismatched against it.
 *
 * @returns `true` once the client confirms this is the main window.
 */
export function useIsMainWindow(): boolean {
	const [isMainWindow, setIsMainWindow] = useState(false);

	useEffect(() => {
		if (window === window.parent && !window.opener) {
			setIsMainWindow(true);
		}
	}, []);

	return isMainWindow;
}

/**
 * Current vertical scroll position, sampled once per animation frame.
 *
 * The listener is passive so it never blocks scrolling, and updates are
 * coalesced into a frame — a `setState` per scroll event re-renders every
 * consumer at scroll frequency.
 *
 * @returns The vertical scroll position in pixels.
 */
export function useVerticalScroll(): number {
	const [scrollY, setScrollY] = useState(0);

	useEffect(() => {
		let frame = 0;

		const handleScroll = () => {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				setScrollY(window.scrollY);
			});
		};

		handleScroll();
		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	return scrollY;
}

type ViewportSize = { width: number; height: number };

const SERVER_VIEWPORT: ViewportSize = { width: 0, height: 0 };

let viewportSnapshot: ViewportSize = SERVER_VIEWPORT;

/**
 * Subscribes to viewport resizes, caching the snapshot outside React.
 *
 * The cached object is required: returning a fresh object from `getSnapshot`
 * makes React see a new value every render and loop forever.
 *
 * @param onStoreChange - Callback React supplies to request a re-render.
 * @returns The unsubscribe function.
 */
function subscribeViewport(onStoreChange: () => void): () => void {
	const handleResize = () => {
		viewportSnapshot = {
			width: window.innerWidth,
			height: window.innerHeight,
		};
		onStoreChange();
	};

	handleResize();
	window.addEventListener('resize', handleResize, { passive: true });

	return () => window.removeEventListener('resize', handleResize);
}

/**
 * Current viewport size.
 *
 * Built on `useSyncExternalStore` so React is given an explicit server snapshot
 * rather than reading `window` during render.
 *
 * @returns The viewport width and height in pixels; zeroes during SSR.
 */
export function useViewportSize(): ViewportSize {
	return useSyncExternalStore(
		subscribeViewport,
		() => viewportSnapshot,
		() => SERVER_VIEWPORT,
	);
}
