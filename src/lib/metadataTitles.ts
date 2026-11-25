/**
 * Removes trailing copies of the site name before Next adds the layout suffix.
 *
 * @param title - An editorial metadata title.
 * @param siteName - The name used by the layout title template.
 * @returns The trimmed title without trailing site-name suffixes.
 */
export function stripSiteTitleSuffix(
	title: string | null | undefined,
	siteName: string,
): string | undefined {
	const name = siteName.trim();
	const value = title?.trim();
	if (!name || !value) return value || undefined;
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const suffix = new RegExp(`(?:\\s*[|–—-]\\s*${escaped})+$`, 'i');
	const base = value.replace(suffix, '').trimEnd();
	return base.toLowerCase() === name.toLowerCase()
		? undefined
		: base || undefined;
}
