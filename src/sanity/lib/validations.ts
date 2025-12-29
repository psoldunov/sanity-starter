import type { Slug, ValidationContext } from 'sanity';
import { client } from '@/sanity/lib/client';
import { getProtectedRouteError, isProtectedRoute } from './utils';

export function validatePageRoute(value: Slug) {
	if (value?.current) {
		if (!value.current.startsWith('/')) {
			return 'Slug must start with a /';
		}

		if (/[\s\t]/.test(value.current)) {
			return 'Slug cannot contain spaces or tabs';
		}

		if (/[A-Z]/.test(value.current)) {
			return 'Slug cannot contain uppercase letters';
		}

		if (isProtectedRoute(value)) {
			return getProtectedRouteError(value);
		}
	}
	return true;
}

export async function validateRedirectRoute(
	value: Slug,
	context: ValidationContext,
) {
	const standardValidation = validatePageRoute(value);
	if (standardValidation !== true) {
		return standardValidation;
	}

	if (!value?.current) {
		return true;
	}

	const existingPage = await client.fetch(
		`*[_type == "page" && route.current == $slug && !(_id == $currentId)][0]`,
		{
			slug: value.current,
			currentId: context.document?._id || '',
		},
	);

	if (existingPage) {
		return 'A page with this route already exists. Redirects cannot use the same route as an existing page.';
	}

	return true;
}
