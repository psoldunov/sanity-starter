/// <reference types="bun" />

// Loads Bun's ambient declarations, which is what makes `import { test } from
// 'bun:test'` resolve under `tsc --noEmit`. TypeScript does not pick
// `@types/bun` up automatically here, and setting `compilerOptions.types` to fix
// it would mean enumerating every other `@types` package by hand.
//
// Companion to the generated `next-env.d.ts`; unlike that file, this one is
// checked in.
