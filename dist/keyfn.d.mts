/**
 * Derive the registration key for a file path.
 * Must stay free of TS-only syntax and closure dependencies: this function is
 * injected into the generated virtual module via `deriveKey.toString()`.
 * @param path - Glob-matched path, e.g. `/src/widgets/date-picker.tsx`
 * @param root - Group root prefix, e.g. `/src/widgets/`
 */
declare const deriveKey: (path: any, root: any) => any;

export { deriveKey };
