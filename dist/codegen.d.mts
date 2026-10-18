/**
 * Derive the common directory root of a set of glob patterns.
 * Root = public directory prefix of each pattern (up to the first `*`),
 * intersected across patterns, always ending with `/`.
 * Negated (`!`) exclusion patterns are ignored for root derivation.
 * @param patterns - Glob patterns relative to project root, e.g. `['/src/widgets/*.tsx']`
 */
declare const commonRoot: (patterns: string[]) => string;
interface GenerateModuleGroupOptions {
    /** Glob patterns (already normalized to array). */
    globs: string[];
    /** Export form. */
    mode?: 'module' | 'raw';
}
interface GenerateModuleOptions {
    /** Normalized groups keyed by export name. */
    groups: Record<string, GenerateModuleGroupOptions>;
}
/**
 * Generate the source of the virtual module.
 * @param options - Normalized plugin options (globs already arrays)
 */
declare const generateModule: (options: GenerateModuleOptions) => string;

export { type GenerateModuleGroupOptions, type GenerateModuleOptions, commonRoot, generateModule };
