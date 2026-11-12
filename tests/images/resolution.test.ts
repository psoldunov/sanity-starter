import { describe, expect, test } from 'bun:test';
import {
	isDereferencedAsset,
	isPassThroughUrl,
	resolveAltText,
	resolveImageDimensions,
	resolveImagePlaceholder,
	resolveImageSizes,
} from '@/lib/image';

describe('isDereferencedAsset', () => {
	test('recognises a dereferenced asset document', () => {
		expect(
			isDereferencedAsset({
				_type: 'sanity.imageAsset',
				url: 'https://cdn.sanity.io/x.jpg',
			}),
		).toBe(true);
	});

	test('rejects a bare reference', () => {
		// This is what a query without `asset->` returns; it carries no blurhash
		// and no dimensions, which is what the caller branches on.
		expect(isDereferencedAsset({ _type: 'reference', _ref: 'image-abc' })).toBe(
			false,
		);
	});

	test('rejects non-objects and partial shapes', () => {
		expect(isDereferencedAsset(null)).toBe(false);
		expect(isDereferencedAsset(undefined)).toBe(false);
		expect(isDereferencedAsset('image-abc')).toBe(false);
		expect(isDereferencedAsset({ _type: 'sanity.imageAsset' })).toBe(false);
	});
});

describe('resolveAltText', () => {
	test('an explicit alt beats the media library', () => {
		// The same asset means different things in different places, so a
		// per-usage description has to win over the global one.
		expect(resolveAltText({ alt: 'Local', altText: 'Global' })).toBe('Local');
	});

	test('falls back to the media library, then the caption', () => {
		expect(resolveAltText({ altText: 'Global' })).toBe('Global');
		expect(resolveAltText({ caption: 'A caption' })).toBe('A caption');
	});

	test('decorative beats every source', () => {
		// A card whose heading is the link already names the image; announcing
		// the asset's alt text there is a duplicate.
		expect(
			resolveAltText({ alt: 'Local', altText: 'Global', decorative: true }),
		).toBe('');
	});

	test('returns an empty string when nothing is available', () => {
		expect(resolveAltText({})).toBe('');
	});
});

describe('resolveImageDimensions', () => {
	test('fill suppresses both dimensions', () => {
		// `fill` and `width`/`height` are mutually exclusive in next/image.
		expect(
			resolveImageDimensions({
				fill: true,
				width: 100,
				dimensions: { width: 2000, height: 1000 },
			}),
		).toEqual({ width: undefined, height: undefined });
	});

	test('explicit props beat the asset dimensions', () => {
		// The bug this guards: a 2000px asset was downloaded in full to fill a
		// 64px box because the intrinsic size was used unconditionally.
		expect(
			resolveImageDimensions({
				width: 64,
				height: 64,
				dimensions: { width: 2000, height: 1000 },
			}),
		).toEqual({ width: 64, height: 64 });
	});

	test('falls back to the intrinsic dimensions', () => {
		expect(
			resolveImageDimensions({ dimensions: { width: 2000, height: 1000 } }),
		).toEqual({ width: 2000, height: 1000 });
	});

	test('one explicit side derives the other from the aspect ratio', () => {
		// The bug this guards: the header passes only `height={32}`, and a
		// 1200×400 logo reserved a 1200×32 box until it loaded (layout shift).
		const dimensions = { width: 1200, height: 400 };
		expect(resolveImageDimensions({ height: 32, dimensions })).toEqual({
			width: 96,
			height: 32,
		});
		expect(resolveImageDimensions({ width: 100, dimensions })).toEqual({
			width: 100,
			height: 33,
		});
	});

	test('the ratio comes from the cropped image that is served', () => {
		// `urlFor` serves only the crop rect, so a 2000×1000 asset cropped by
		// half its width is a square on the page.
		expect(
			resolveImageDimensions({
				height: 64,
				dimensions: { width: 2000, height: 1000 },
				crop: { left: 0.25, right: 0.25, top: 0, bottom: 0 },
			}),
		).toEqual({ width: 64, height: 64 });
		expect(
			resolveImageDimensions({
				dimensions: { width: 2000, height: 1000 },
				crop: { left: 0.25, right: 0.25, top: 0, bottom: 0 },
			}),
		).toEqual({ width: 1000, height: 1000 });
	});

	test('tolerates missing metadata', () => {
		expect(resolveImageDimensions({})).toEqual({
			width: undefined,
			height: undefined,
		});
	});
});

describe('resolveImageSizes', () => {
	test('an explicit sizes value is used as-is', () => {
		expect(resolveImageSizes('50vw', true)).toBe('50vw');
	});

	test('a filled image defaults to 100vw', () => {
		// Without this the browser assumes 100vw anyway and picks the widest
		// srcset candidate on every viewport — the default just makes it explicit
		// so the value is overridable.
		expect(resolveImageSizes(undefined, true)).toBe('100vw');
	});

	test('a non-filled image gets no sizes', () => {
		expect(resolveImageSizes(undefined, false)).toBeUndefined();
		expect(resolveImageSizes(undefined, undefined)).toBeUndefined();
	});
});

describe('resolveImagePlaceholder', () => {
	test('keeps the LQIP for a raster image', () => {
		const lqip = 'data:image/png;base64,iVBORw0KGgo=';
		expect(
			resolveImagePlaceholder('https://cdn.sanity.io/images/p/d/x.jpg', lqip),
		).toBe(lqip);
	});

	test('drops the placeholder for an SVG', () => {
		// `next/image` paints the placeholder *behind* the image until it loads,
		// and vector art is usually a logo on transparency — so a blur under an
		// SVG shows straight through the artwork.
		expect(
			resolveImagePlaceholder(
				'https://cdn.sanity.io/images/p/d/logo.svg',
				'data:image/png;base64,iVBORw0KGgo=',
			),
		).toBeUndefined();
	});

	test('reads the path, not the whole URL', () => {
		// A Sanity URL carrying transformation parameters no longer ends in its
		// file extension. A naive `endsWith('.svg')` misses every one of them.
		expect(
			resolveImagePlaceholder(
				'https://cdn.sanity.io/images/p/d/logo.svg?w=320&q=75',
				'data:image/png;base64,iVBORw0KGgo=',
			),
		).toBeUndefined();
	});
});

describe('isPassThroughUrl', () => {
	test('SVG and GIF pass through, raster images do not', () => {
		// Sanity cannot transform an SVG, and resizing an animated GIF can drop
		// its animation. The check reads the path, so a crop `rect` query and an
		// upper-case extension are both still recognised.
		expect(
			isPassThroughUrl(
				'https://cdn.sanity.io/images/p/d/logo.svg?rect=0,0,10,10',
			),
		).toBe(true);
		expect(isPassThroughUrl('https://cdn.sanity.io/images/p/d/loop.GIF')).toBe(
			true,
		);
		expect(isPassThroughUrl('https://cdn.sanity.io/images/p/d/photo.jpg')).toBe(
			false,
		);
	});
});
