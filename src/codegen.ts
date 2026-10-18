/**
 * Derive the common directory root of a set of glob patterns.
 * Root = public directory prefix of each pattern (up to the first `*`),
 * intersected across patterns, always ending with `/`.
 * Negated (`!`) exclusion patterns are ignored for root derivation.
 * @param patterns - Glob patterns relative to project root, e.g. `['/src/widgets/*.tsx']`
 */
export const commonRoot = (patterns: string[]): string => {
  const roots = patterns
    .filter((p) => !p.startsWith('!'))
    .map((p) => {
      const star = p.indexOf('*');
      return star === -1 ? p : p.slice(0, star);
    });
  let prefix = roots[0] || '/';
  for (const r of roots) {
    while (!r.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  const idx = prefix.lastIndexOf('/');
  return idx <= 0 ? '/' : prefix.slice(0, idx + 1);
};

import { buildModule, type GroupSpec } from './template';

export interface GenerateModuleGroupOptions {
  /** Glob patterns (already normalized to array). */
  globs: string[];
  /** Export form. */
  mode?: 'module' | 'raw';
}

export interface GenerateModuleOptions {
  /** Normalized groups keyed by export name. */
  groups: Record<string, GenerateModuleGroupOptions>;
}

/**
 * Generate the source of the virtual module.
 * @param options - Normalized plugin options (globs already arrays)
 */
export const generateModule = (options: GenerateModuleOptions): string => {
  const specs: GroupSpec[] = Object.entries(options.groups).map(([name, group]) => ({
    name,
    globs: group.globs,
    root: commonRoot(group.globs),
    raw: group.mode === 'raw',
  }));
  return buildModule(specs);
};
