/**
 * Constants shared between schema definitions and Studio components.
 *
 * Kept in its own module because `defineSection` imports `SectionPreview` and
 * `SectionPreview` needs this value — importing it from either of those would
 * close a cycle.
 */

/**
 * Marker written to a section preview's `description` when the section is
 * hidden, and read back by `SectionPreview` to render the hidden badge.
 *
 * `PreviewValue` only carries `title`, `subtitle`, `description`, `media` and
 * `imageUrl`, so a flag has to travel inside one of them. `description` is the
 * one section previews do not otherwise use, and the value is a readable word
 * rather than an encoded payload — so on any Studio surface that renders the
 * description directly, it still reads correctly.
 */
export const HIDDEN_SECTION_DESCRIPTION = 'Hidden';
