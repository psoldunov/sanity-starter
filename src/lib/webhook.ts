/**
 * Checks the timestamp in a Sanity webhook signature.
 * @param header - The signature header.
 * @param now - Current time in milliseconds.
 * @returns Whether the timestamp is within the accepted window.
 */
export function isFreshSignatureTimestamp(
	header: string,
	now: number,
): boolean {
	const match = /^t=(\d+)[, ]+v1=[^, ]+$/.exec(header);
	if (!match) return false;
	const timestamp = Number(match[1]);
	// Sanity retries twice at 30-second intervals; five minutes also allows delivery delays.
	return (
		Number.isSafeInteger(timestamp) &&
		timestamp >= now - 300_000 &&
		timestamp <= now + 60_000
	);
}
