'use server';

import { draftMode } from 'next/headers';

/**
 * Disables draft mode and waits briefly for the cookie change to propagate.
 * @returns A promise that resolves when draft mode is disabled.
 */
export async function disableDraftMode() {
	const disable = (await draftMode()).disable();
	const delay = new Promise((resolve) => setTimeout(resolve, 1000));
	await Promise.allSettled([disable, delay]);
}
