import { useEffect, useState } from 'react';

/**
 * Hook to check if the component is running in the main window
 * (not in an iframe and not opened by another window)
 * @returns false during SSR and until client-side hydration
 */
export function useIsMainWindow(): boolean {
	const [isMainWindow, setIsMainWindow] = useState(false);

	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			window === window.parent &&
			!window.opener
		) {
			setIsMainWindow(true);
		}
	}, []);

	return isMainWindow;
}

/**
 * Tracks the current vertical scroll position of the window.
 * @returns The current vertical scroll position in pixels.
 */
export function useVerticalScroll(): number {
	const [scrollY, setScrollY] = useState<number>(0);

	useEffect(() => {
		const handleScroll = () => {
			setScrollY(window.scrollY);
		};

		window.addEventListener('scroll', handleScroll);

		handleScroll();

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	return scrollY;
}

/**
 * Tracks the current viewport size.
 * @returns The current viewport width and height in pixels.
 */
export function useViewportSize(): { width: number; height: number } {
	const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const handleResize = () => {
			setViewportSize({ width: window.innerWidth, height: window.innerHeight });
		};

		handleResize();

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	return viewportSize;
}
