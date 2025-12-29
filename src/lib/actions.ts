'use server';

import { draftMode } from 'next/headers';

/**
 * Enables draft mode for the current request.
 * This function sets the draft mode cookie and returns a promise that resolves when the cookie is set.
 * @returns {Promise<void>} A promise that resolves when draft mode is enabled.
 */
export async function disableDraftMode() {
	const disable = (await draftMode()).disable();
	const delay = new Promise((resolve) => setTimeout(resolve, 1000));
	await Promise.allSettled([disable, delay]);
}
