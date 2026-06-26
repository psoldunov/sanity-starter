'use client';

import { FormField, type ObjectFieldProps } from 'sanity';

/**
 * Field wrapper for the `internalDestination` object. Sanity renders object
 * fields inside a collapsible fieldset by default, which hides the custom
 * destination picker behind a toggle. This replaces that chrome with a flat
 * `FormField` so the picker shows inline with just its title and description.
 *
 * @param props - Standard Sanity object field props for `internalDestination`.
 * @returns The non-collapsible field wrapper around the picker input.
 */
export default function DestinationField(props: ObjectFieldProps) {
	return (
		<FormField
			title={props.title}
			description={props.description}
			validation={props.validation}
			__unstable_presence={props.presence}
			inputId={props.inputId}
			level={props.level}
		>
			{props.children}
		</FormField>
	);
}
