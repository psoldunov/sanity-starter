import { describe, expect, test } from 'bun:test';
import { isFreshSignatureTimestamp } from '@/lib/webhook';

// Security: src/app/api/revalidate/route.ts rejects replayed signatures.
describe('webhook timestamp', () => {
	const now = 1_700_000_000_000;
	test('accepts fresh signatures and rejects stale, future and malformed headers', () => {
		expect(isFreshSignatureTimestamp(`t=${now},v1=x`, now)).toBe(true);
		expect(isFreshSignatureTimestamp(`t=${now - 300_001},v1=x`, now)).toBe(
			false,
		);
		expect(isFreshSignatureTimestamp(`t=${now + 60_001},v1=x`, now)).toBe(
			false,
		);
		expect(isFreshSignatureTimestamp('bad', now)).toBe(false);
	});
});
