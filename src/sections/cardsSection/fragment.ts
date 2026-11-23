/**
 * GROQ projection for `cardsSection`, interpolated into `PAGE_QUERY` by
 * `bun run sections:gen`. Dereferences each card's image asset so `SmartImage`
 * gets the LQIP placeholder and intrinsic dimensions.
 */
export const fragment = `
	_type == "cardsSection" => {
		...,
		cards[] {
			...,
			image {
				...,
				asset->,
			},
		},
	}`;
