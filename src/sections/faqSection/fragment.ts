/**
 * GROQ projection for `faqSection`, interpolated into `PAGE_QUERY` by
 * `bun run sections:gen`. Questions and answers are plain fields, so nothing
 * needs dereferencing; the guard still has to exist for the section to be
 * projected at all.
 */
export const fragment = `
	_type == "faqSection" => {
		...,
	}`;
