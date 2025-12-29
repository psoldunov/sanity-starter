import { useEffect, useState } from 'react';

/**
 * Hook to check if the component is running in the main window
 * (not in an iframe and not opened by another window)
 * Returns false during SSR and until client-side hydration
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
