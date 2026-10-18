/** One normalized group as consumed by buildModule. */
interface GroupSpec {
    /** Export name (valid JS identifier). */
    name: string;
    /** Normalized glob patterns (excludes included). */
    globs: string[];
    /** Common root prefix, e.g. `/src/widgets/`. */
    root: string;
    /** true → read file content as string (`?raw`). */
    raw: boolean;
}
/**
 * Build the { key: value } map from import.meta.glob results.
 * Must stay free of TS-only syntax and closure dependencies: this function is
 * injected into the generated virtual module via `toMap.toString()`, so every
 * dependency must be an explicit parameter. Bundlers rewrite free-variable
 * references (e.g. `deriveKey` -> `_chunkXxx.deriveKey`) and the renamed
 * binding would not exist in the virtual module.
 * @param files - import.meta.glob result, `{ path: module | raw string }`
 * @param root - Group root prefix, e.g. `/src/widgets/`
 * @param deriveKey - Key derivation function, supplied by the generated module
 */
declare function toMap(files: any, root: any, deriveKey: any): {};
/**
 * Assemble the full source of the virtual module — one glob per group.
 * Runtime helpers (deriveKey/toMap) are injected via `toString()` so they
 * live here as real code instead of inline string literals.
 * @param groups - Normalized group specs in option order
 */
declare const buildModule: (groups: GroupSpec[]) => string;

export { type GroupSpec, buildModule, toMap };
