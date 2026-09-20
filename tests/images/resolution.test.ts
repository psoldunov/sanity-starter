import { describe, expect, test } from 'bun:test';
import {
	isDereferencedAsset,
	resolveAltText,
	resolveImageDimensions,
	resolveImagePlaceholder,
	resolveImageSizes,
	resolveImageSource,
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

describe('resolveImageSource', () => {
	test('a raster image gets CDN transformation parameters', () => {
		const { src, unoptimized } = resolveImageSource(
			'https://cdn.sanity.io/images/p/d/photo.jpg',
			{ width: 640, quality: 80 },
		);

		expect(unoptimized).toBe(false);
		expect(src).toContain('w=640');
		expect(src).toContain('q=80');
	});

	test('an SVG is passed through unoptimised', () => {
		// Next's optimiser refuses SVG outright unless `dangerouslyAllowSVG` is
		// set, and it only skips optimisation by itself when `src` ends in
		// `.svg` — which a transformed Sanity URL does not.
		const { src, unoptimized } = resolveImageSource(
			'https://cdn.sanity.io/images/p/d/logo.svg?w=320',
			{ width: 640 },
		);

		expect(unoptimized).toBe(true);
		expect(src).toBe('https://cdn.sanity.io/images/p/d/logo.svg?w=320');
	});

	test('a GIF is passed through unoptimised', () => {
		// The optimiser serves an animated GIF unchanged and warns about it, so
		// the round trip buys nothing and costs a transform.
		const { src, unoptimized } = resolveImageSource(
			'https://cdn.sanity.io/images/p/d/loop.GIF',
			{ width: 640 },
		);

		expect(unoptimized).toBe(true);
		expect(src).toBe('https://cdn.sanity.io/images/p/d/loop.GIF');
	});
});
