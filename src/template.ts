import { deriveKey } from './keyfn';

/** One normalized group as consumed by buildModule. */
export interface GroupSpec {
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
export function toMap(files, root, deriveKey) {
  const map = {};
  for (const path of Object.keys(files)) {
    const key = deriveKey(path, root);
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      console.warn('[vite-plugin-file-hub] duplicate file key "' + key + '" from "' + path + '", overwritten.');
    }
    const mod = files[path];
    map[key] = mod.default || mod;
  }
  return map;
}

/**
 * Assemble the full source of the virtual module — one glob per group.
 * Runtime helpers (deriveKey/toMap) are injected via `toString()` so they
 * live here as real code instead of inline string literals.
 * @param groups - Normalized group specs in option order
 */
export const buildModule = (groups: GroupSpec[]): string => {
  const globLines = groups
    .map((g) => {
      const opts = g.raw
        ? `{ eager: true, query: '?raw', import: 'default' }`
        : `{ eager: true }`;
      return `const ${g.name}Files = import.meta.glob(${JSON.stringify(g.globs)}, ${opts});`;
    })
    .join('\n');
  const exportLines = groups
    .map(
      (g) =>
        `export const ${g.name} = toMap(${g.name}Files, ${JSON.stringify(g.root)}, deriveKey);`,
    )
    .join('\n');
  const names = groups.map((g) => g.name).join(', ');
  return `
const deriveKey = ${deriveKey.toString()};
const toMap = ${toMap.toString()};

${globLines}

${exportLines}
export default { ${names} };
`.trim();
};
