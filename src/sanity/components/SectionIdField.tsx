'use client';

import type { FieldProps } from 'sanity';

/**
 * Pass-through field wrapper for the `sectionId` field. Strips Studio's default
 * field chrome (title + description) so `SectionIdInput` owns its own label and
 * can hide the field entirely — label and description included — when the
 * destination is not an anchorable page.
 *
 * @param props - Standard Sanity field props for the `sectionId` string field.
 * @returns The input with no surrounding title/description chrome.
 */
export default function SectionIdField(props: FieldProps) {
	return <>{props.children}</>;
}
