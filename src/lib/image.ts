/**
 * Builds an optimized Sanity CDN image URL with transformation query parameters.
 *
 * Adds width (`w`), height (`h`), and quality (`q`) query parameters to a Sanity image URL
 * for on-the-fly image transformations via Sanity's CDN.
 *
 * @param url - The base Sanity image URL to optimize (typically from `image.asset.url`)
 * @param options - Configuration options for the optimized URL
 * @param options.width - Optional width in pixels (adds `w` query parameter)
 * @param options.height - Optional height in pixels (adds `h` query parameter)
 * @param options.quality - Image quality from 1-100 (adds `q` query parameter, defaults to 75)
 * @returns The optimized Sanity CDN URL string with transformation query parameters appended
 */
export function buildOptimizedImageUrl(
	url: string,
	{
		width,
		height,
		quality = 75,
	}: {
		width?: number;
		height?: number;
		quality?: number;
	},
): string {
	const urlObject = new URL(url);

	if (width) {
		urlObject.searchParams.set('w', width.toString());
	}
	if (height) {
		urlObject.searchParams.set('h', height.toString());
	}
	if (quality !== undefined) {
		urlObject.searchParams.set('q', quality.toString());
	}

	return urlObject.toString();
}
