/**
 * Locale used for all rendered dates.
 *
 * Pinned rather than left to the runtime: server and client must agree or React
 * reports a hydration mismatch, and the server's locale is not the visitor's.
 */
const DATE_LOCALE = 'en-US';

const POST_DATE_FORMAT = new Intl.DateTimeFormat(DATE_LOCALE, {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	timeZone: 'UTC',
});

/**
 * Formats an ISO timestamp as a readable post date.
 *
 * @param value - ISO 8601 timestamp, typically `publishedAt`.
 * @returns The formatted date, or an empty string when the value is unusable.
 */
export function formatPostDate(value: string | null | undefined): string {
	if (!value) return '';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';

	return POST_DATE_FORMAT.format(date);
}
