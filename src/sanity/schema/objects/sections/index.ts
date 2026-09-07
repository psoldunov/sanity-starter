import cardsSection from './cardsSection';
import heroSection from './heroSection';
import imageTextSection from './imageTextSection';

/**
 * Registered section schema types, in the order they appear in the Studio's
 * insert menu.
 *
 * GROQ fragments deliberately do NOT live here — they are in
 * `src/sanity/lib/fragments.ts`, which imports nothing. This module imports
 * `defineSection`, and through it the whole `sanity` Studio runtime; anything
 * the public site imports must not reach it.
 */
const sectionTypes = [heroSection, cardsSection, imageTextSection];

export default sectionTypes;
