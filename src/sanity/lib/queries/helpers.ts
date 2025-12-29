import { groq } from 'next-sanity';

export function getImageFragment(name = 'image') {
	return groq`
    ${name} {
      ...,
      asset->
    },
  `;
}
