/**
 * GROQ projection for `imageTextSection`, interpolated into `PAGE_QUERY` by
 * `bun run sections:gen`. Dereferences the image asset so `SmartImage` gets the
 * LQIP placeholder and intrinsic dimensions.
 */
export const fragment = `
	_type == "imageTextSection" => {
		...,
		image {
			...,
			asset->,
		},
	}`;
