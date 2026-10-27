/**
 * Where a document's markdown lives: `/` → `/index.md`, `/about` →
 * `/about.md`, `/posts/hello` → `/posts/hello.md`.
 *
 * A page routed `/index` would collide with the home page's file and is not
 * served as markdown; the home page wins.
 */

const EXTENSION = '.md';
const HOME_MARKDOWN_PATH = '/index.md';

/**
 * The markdown path of a page or post.
 *
 * @param path - Its HTML path, e.g. `/about`.
 * @returns Its markdown path, e.g. `/about.md`.
 */
export function htmlPathToMarkdownPath(path: string): string {
	return path === '/' ? HOME_MARKDOWN_PATH : `${path}${EXTENSION}`;
}

/**
 * The HTML path a markdown path belongs to.
 *
 * @param path - A requested path, e.g. `/about.md`.
 * @returns The HTML path, e.g. `/about`, or `undefined` when the path is not
 *   a markdown path.
 */
export function markdownPathToHtmlPath(path: string): string | undefined {
	if (path === HOME_MARKDOWN_PATH) return '/';
	if (!path.startsWith('/') || !path.endsWith(EXTENSION)) return undefined;

	const htmlPath = path.slice(0, -EXTENSION.length);

	// `/.md` and `/a/.md` name no page.
	if (htmlPath === '' || htmlPath.endsWith('/')) return undefined;

	return htmlPath;
}
