# vite-plugin-file-hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@jswork/vite-plugin-file-hub` — a Vite plugin that exposes glob-matched project files, grouped, via a `virtual:file-hub` module as ES modules or raw strings.

**Architecture:** Four source modules ported from `vite-plugin-react-modal-hub` with modal-domain semantics removed and multi-group + raw-mode added: `keyfn.ts` (path → key), `codegen.ts` (common root + module generation over groups), `template.ts` (runtime helpers injected via `toString()` + module assembly), `index.ts` (plugin factory). A virtual module is generated per `load` hook call; raw groups use `import.meta.glob` with `query: '?raw'`.

**Tech Stack:** TypeScript, Vite plugin API (type-only), tsup (cjs+esm+dts), bun test, pnpm.

**Repo:** `/Users/afei/github/vite-plugin-file-hub` (remote `git@github.com:afeiship/vite-plugin-file-hub.git` already added; **never push** — user pushes manually).

**Spec:** `docs/superpowers/specs/2026-10-18-file-hub-design.md`

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsup.config.ts`, `.gitignore`, `LICENSE.txt`, `.release-it.json`, `client.d.ts`
- Create: `README.md` (structure only; content filled in Task 6 — actually create full README in Task 6, so NOT here)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@jswork/vite-plugin-file-hub",
  "version": "0.0.0",
  "description": "Zero-config glob discovery exposing project files as modules or raw strings.",
  "main": "./dist/index.cjs.js",
  "module": "./dist/index.esm.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.esm.js"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.cjs.js"
      }
    },
    "./client": {
      "types": "./client.d.ts"
    },
    "./package.json": "./package.json"
  },
  "files": [
    "dist",
    "client.d.ts"
  ],
  "scripts": {
    "build": "tsup",
    "test": "bun test",
    "release": "release-it"
  },
  "license": "MIT",
  "devDependencies": {
    "@swc/core": "^1.3.101",
    "@types/jest": "^29.5.12",
    "@types/node": "^18.15.5",
    "tslib": "^2.6.2",
    "tsup": "^8.0.1",
    "typescript": "^4.9.5",
    "vite": "^5.4.7"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org"
  },
  "keywords": [
    "vite",
    "plugin",
    "glob",
    "virtual-module",
    "raw"
  ]
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "es2018",
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true,
    "pretty": true,
    "esModuleInterop": true,
    "skipDefaultLibCheck": true,
    "module": "es2015",
    "moduleResolution": "node",
    "noImplicitAny": false
  },
  "include": [
    "src",
    "__tests__"
  ]
}
```

- [ ] **Step 3: Create `tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/*.ts'],
  format: ['cjs', 'esm'],
  splitting: true,
  cjsInterop: true,
  clean: true,
  dts: true,
  sourcemap: true,
  outExtension({ format }) {
    return {
      js: `.${format}.js`,
    };
  },
});
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules
bower_components
coverage
npm-debug.log
yarn.lock
package-lock.json
pnpm-lock.yaml
.DS_Store
.idea
.vscode
dist

.tmp
.superpowers
```

- [ ] **Step 5: Create `LICENSE.txt`**

```
The MIT License (MIT)

Copyright (c) 2026 afei <1290657123@qq.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 6: Create `.release-it.json`**

```json
{
  "git": {
    "requireCleanWorkingDir": false
  },
  "hooks": {
    "after:init": [
      "npm run test",
      "t2k"
    ],
    "after:bump": [
      "npm run build"
    ],
    "after:release": [
      "npm pkg get name | cnpm sync"
    ]
  },
  "github": {
    "release": true,
    "proxy": "http://127.0.0.1:9090"
  }
}
```

- [ ] **Step 7: Create `client.d.ts`**

```ts
declare module 'virtual:file-hub' {
  type FileMap = Record<string, any>;
  type FileHub = Record<string, FileMap>;
  const hub: FileHub;
  export default hub;
}
```

- [ ] **Step 8: Install dependencies**

Run: `cd /Users/afei/github/vite-plugin-file-hub && pnpm install`
Expected: lockfile created, `node_modules` present. If network fails, retry with `http_proxy=http://127.0.0.1:9090 https_proxy=http://127.0.0.1:9090 pnpm install`.

- [ ] **Step 9: Commit scaffolding**

```bash
cd /Users/afei/github/vite-plugin-file-hub
git add -A
git commit -m "chore: scaffold project with tsup, bun test and release-it

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: `deriveKey` (keyfn)

**Files:**
- Test: `__tests__/index.spec.ts` (create with `deriveKey` block only)
- Create: `src/keyfn.ts`

- [ ] **Step 1: Write the failing test** — create `__tests__/index.spec.ts`:

```ts
import { deriveKey } from '../src/keyfn';

describe('deriveKey', () => {
  test('plain file: login.tsx → login', () => {
    expect(deriveKey('/src/modals/login.tsx', '/src/modals/')).toBe('login');
  });

  test('camelizes kebab: date-picker.tsx → datePicker', () => {
    expect(deriveKey('/src/modals/date-picker.tsx', '/src/modals/')).toBe('datePicker');
  });

  test('folds index: user/index.tsx → user', () => {
    expect(deriveKey('/src/modals/user/index.tsx', '/src/modals/')).toBe('user');
  });

  test('joins subdirs with dot: confirm/delete/index.tsx → confirm.delete', () => {
    expect(deriveKey('/src/modals/confirm/delete/index.tsx', '/src/modals/')).toBe('confirm.delete');
  });

  test('non-index file in subdir: user/profile.tsx → user.profile', () => {
    expect(deriveKey('/src/modals/user/profile.tsx', '/src/modals/')).toBe('user.profile');
  });

  test('empty after fold falls back to index: index.tsx → index', () => {
    expect(deriveKey('/src/modals/index.tsx', '/src/modals/')).toBe('index');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/afei/github/vite-plugin-file-hub && bun test`
Expected: FAIL — cannot resolve `../src/keyfn`

- [ ] **Step 3: Write minimal implementation** — create `src/keyfn.ts`:

```ts
/**
 * Derive the registration key for a file path.
 * Must stay free of TS-only syntax and closure dependencies: this function is
 * injected into the generated virtual module via `deriveKey.toString()`.
 * @param path - Glob-matched path, e.g. `/src/widgets/date-picker.tsx`
 * @param root - Group root prefix, e.g. `/src/widgets/`
 */
export const deriveKey = (path, root) => {
  const rel = path.startsWith(root) ? path.slice(root.length) : path;
  const noExt = rel.replace(/\.[^/.]+$/, '');
  const segments = noExt.split('/').filter(Boolean);
  if (segments[segments.length - 1] === 'index') segments.pop();
  if (segments.length === 0) segments.push('index');
  return segments
    .map((seg) => seg.replace(/[._-]/g, '_').replace(/_(\w)/g, (_, c) => c.toUpperCase()))
    .join('.');
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/afei/github/vite-plugin-file-hub && bun test`
Expected: PASS (6 deriveKey tests)

- [ ] **Step 5: Commit**

```bash
git add src/keyfn.ts __tests__/index.spec.ts
git commit -m "feat: add deriveKey path-to-key derivation

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: `commonRoot`

**Files:**
- Modify: `__tests__/index.spec.ts` (append `commonRoot` block)
- Create: `src/codegen.ts`

- [ ] **Step 1: Write the failing test** — append to `__tests__/index.spec.ts`:

```ts
import { commonRoot } from '../src/codegen';

describe('commonRoot', () => {
  test('single pattern keeps dir prefix up to first *', () => {
    expect(commonRoot(['/src/widgets/*.tsx'])).toBe('/src/widgets/');
  });

  test('multiple patterns with same prefix share the prefix', () => {
    expect(commonRoot(['/src/widgets/*.tsx', '/src/widgets/**/index.tsx'])).toBe('/src/widgets/');
  });

  test('multiple patterns cut back to common directory', () => {
    expect(commonRoot(['/src/a/*.tsx', '/src/b/*.tsx'])).toBe('/src/');
  });

  test('no common prefix falls back to /', () => {
    expect(commonRoot(['/a/*.tsx', '/b/*.tsx'])).toBe('/');
  });

  test('excludes ! patterns from root derivation', () => {
    expect(commonRoot(['/src/widgets/*.tsx', '!/src/widgets/**/draft.tsx'])).toBe('/src/widgets/');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/afei/github/vite-plugin-file-hub && bun test`
Expected: FAIL — cannot resolve `../src/codegen`

- [ ] **Step 3: Write minimal implementation** — create `src/codegen.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/afei/github/vite-plugin-file-hub && bun test`
Expected: PASS (11 tests: 6 deriveKey + 5 commonRoot)

- [ ] **Step 5: Commit**

```bash
git add src/codegen.ts __tests__/index.spec.ts
git commit -m "feat: add commonRoot glob root derivation

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: `template.ts` (toMap + buildModule) and `generateModule`

**Files:**
- Create: `src/template.ts`
- Modify: `src/codegen.ts` (append `generateModule`)
- Modify: `__tests__/index.spec.ts` (append `generateModule` block)

- [ ] **Step 1: Write the failing test** — append to `__tests__/index.spec.ts`:

```ts
import { generateModule } from '../src/codegen';

describe('generateModule', () => {
  test('emits eager module glob for module group with derived root', () => {
    const code = generateModule({ groups: { widgets: { globs: ['/src/widgets/*.tsx'] } } });
    expect(code).toContain('const widgetsFiles = import.meta.glob(["/src/widgets/*.tsx"], { eager: true })');
    expect(code).toContain('export const widgets = toMap(widgetsFiles, "/src/widgets/", deriveKey)');
    expect(code).toContain('export default { widgets };');
  });

  test('emits raw glob with query for raw group', () => {
    const code = generateModule({ groups: { locales: { globs: ['/src/locales/*.json'], mode: 'raw' } } });
    expect(code).toContain(
      `const localesFiles = import.meta.glob(["/src/locales/*.json"], { eager: true, query: '?raw', import: 'default' })`
    );
    expect(code).toContain('export const locales = toMap(localesFiles, "/src/locales/", deriveKey)');
  });

  test('emits every group on default export', () => {
    const code = generateModule({
      groups: {
        locales: { globs: ['/src/locales/*.json'], mode: 'raw' },
        widgets: { globs: ['/src/widgets/*.tsx'] },
      },
    });
    expect(code).toContain('export default { locales, widgets };');
  });

  test('injects runtime helpers via toString with duplicate warn', () => {
    const code = generateModule({ groups: { widgets: { globs: ['/src/widgets/*.tsx'] } } });
    expect(code).toContain('function toMap(files, root, deriveKey)');
    expect(code).toContain('const deriveKey = ');
    expect(code).toContain('duplicate file key');
    expect(code).toContain('console.warn');
    expect(code).toContain('mod.default || mod');
    expect(code).toContain('Object.prototype.hasOwnProperty.call(map, key)');
  });

  test('keeps ! exclusions in glob but strips them from the root', () => {
    const code = generateModule({
      groups: { widgets: { globs: ['/src/widgets/*.tsx', '!/src/widgets/**/draft.tsx'] } },
    });
    expect(code).toContain('import.meta.glob(["/src/widgets/*.tsx","!/src/widgets/**/draft.tsx"], { eager: true })');
    expect(code).toContain('toMap(widgetsFiles, "/src/widgets/", deriveKey)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/afei/github/vite-plugin-file-hub && bun test`
Expected: FAIL — `generateModule` has no `groups` handling / `buildModule` not exported yet (type error or wrong output)

- [ ] **Step 3: Write `src/template.ts`**

```ts
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
      const opts = g.raw ? `{ eager: true, query: '?raw', import: 'default' }` : `{ eager: true }`;
      return `const ${g.name}Files = import.meta.glob(${JSON.stringify(g.globs)}, ${opts});`;
    })
    .join('\n');
  const exportLines = groups
    .map((g) => `export const ${g.name} = toMap(${g.name}Files, ${JSON.stringify(g.root)}, deriveKey);`)
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
```

- [ ] **Step 4: Append `generateModule` to `src/codegen.ts`**

Add at the end of `src/codegen.ts` (plus the import at the top):

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /Users/afei/github/vite-plugin-file-hub && bun test`
Expected: PASS (16 tests)

- [ ] **Step 6: Commit**

```bash
git add src/template.ts src/codegen.ts __tests__/index.spec.ts
git commit -m "feat: generate grouped virtual module with module and raw modes

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: Plugin factory (`index.ts`)

**Files:**
- Modify: `__tests__/index.spec.ts` (append `vitePlugin` block)
- Create: `src/index.ts`

- [ ] **Step 1: Write the failing test** — append to `__tests__/index.spec.ts`:

```ts
import vitePlugin from '../src';

describe('vitePlugin', () => {
  test('returns plugin object with name and hooks', () => {
    const plugin = vitePlugin({ groups: { widgets: { globs: '/src/widgets/*.tsx' } } });
    expect(plugin.name).toBe('vite-plugin-file-hub');
    expect(typeof plugin.resolveId).toBe('function');
    expect(typeof plugin.load).toBe('function');
  });

  test('throws without groups', () => {
    expect(() => (vitePlugin as any)({})).toThrow('options.groups is required');
  });

  test('throws on empty groups object', () => {
    expect(() => (vitePlugin as any)({ groups: {} })).toThrow('options.groups is required');
  });

  test('throws when a group has no globs', () => {
    expect(() => (vitePlugin as any)({ groups: { widgets: {} } })).toThrow('requires globs');
  });

  test('throws on group name that is not a JS identifier', () => {
    expect(() => (vitePlugin as any)({ groups: { 'my-group': { globs: '/src/*.tsx' } } })).toThrow(
      'invalid group name'
    );
  });

  test('resolveId hits virtual:file-hub and misses others', () => {
    const plugin = vitePlugin({ groups: { widgets: { globs: '/src/widgets/*.tsx' } } });
    const resolveId = plugin.resolveId as any;
    expect(resolveId.call({} as any, 'virtual:file-hub')).toBe('\0virtual:file-hub');
    expect(resolveId.call({} as any, 'other-module')).toBeUndefined();
  });

  test('resolveId honors a custom id', () => {
    const plugin = vitePlugin({ groups: { widgets: { globs: '/src/*.tsx' } }, id: 'virtual:my-hub' });
    const resolveId = plugin.resolveId as any;
    expect(resolveId.call({} as any, 'virtual:my-hub')).toBe('\0virtual:my-hub');
    expect(resolveId.call({} as any, 'virtual:file-hub')).toBeUndefined();
  });

  test('load emits multi-group module with modes and roots', () => {
    const plugin = vitePlugin({
      groups: {
        locales: { globs: '/src/locales/*.json', mode: 'raw' },
        widgets: { globs: ['/src/widgets/*.tsx', '!/src/widgets/**/draft.tsx'] },
      },
    });
    const load = plugin.load as any;
    const code = load.call({} as any, '\0virtual:file-hub');
    expect(code).toContain(
      `const localesFiles = import.meta.glob(["/src/locales/*.json"], { eager: true, query: '?raw', import: 'default' })`
    );
    expect(code).toContain('import.meta.glob(["/src/widgets/*.tsx","!/src/widgets/**/draft.tsx"], { eager: true })');
    expect(code).toContain('export const locales = toMap(localesFiles, "/src/locales/", deriveKey)');
    expect(code).toContain('export const widgets = toMap(widgetsFiles, "/src/widgets/", deriveKey)');
    expect(code).toContain('export default { locales, widgets };');
  });

  test('load misses foreign ids', () => {
    const plugin = vitePlugin({ groups: { widgets: { globs: '/src/*.tsx' } } });
    const load = plugin.load as any;
    expect(load.call({} as any, '\0some-other-module')).toBeUndefined();
  });

  test('default export shape: factory function', () => {
    expect(typeof vitePlugin).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/afei/github/vite-plugin-file-hub && bun test`
Expected: FAIL — cannot resolve `../src` (no `src/index.ts`)

- [ ] **Step 3: Write minimal implementation** — create `src/index.ts`:

```ts
import type { Plugin } from 'vite';
import { generateModule } from './codegen';

export interface FileHubGroupOptions {
  /**
   * Glob(s) for this group (relative to project root, `!` excludes supported).
   */
  globs: string | string[];
  /**
   * Export form: `module` = ES module imports, `raw` = file content as string.
   * @default 'module'
   */
  mode?: 'module' | 'raw';
}

export interface FileHubPluginOptions {
  /**
   * At least one group. Keys become export names on the virtual module
   * and must be valid JS identifiers.
   */
  groups: Record<string, FileHubGroupOptions>;
  /**
   * Virtual module id.
   * @default 'virtual:file-hub'
   */
  id?: string;
}

const toArr = (value: string | string[]): string[] => (Array.isArray(value) ? value : [value]);
const IDENT_RE = /^[A-Za-z_$][\w$]*$/;

const factory = (inOptions: FileHubPluginOptions): Plugin => {
  const groups = inOptions?.groups;
  if (!groups || Object.keys(groups).length === 0) {
    throw new Error('[vite-plugin-file-hub] options.groups is required (at least one group).');
  }

  const normalized: Record<string, { globs: string[]; mode: 'module' | 'raw' }> = {};
  for (const [name, group] of Object.entries(groups)) {
    if (!IDENT_RE.test(name)) {
      throw new Error(`[vite-plugin-file-hub] invalid group name "${name}": must be a valid JS identifier.`);
    }
    if (!group?.globs) {
      throw new Error(`[vite-plugin-file-hub] group "${name}" requires globs.`);
    }
    normalized[name] = { globs: toArr(group.globs), mode: group.mode ?? 'module' };
  }

  const virtualModuleId = inOptions?.id ?? 'virtual:file-hub';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'vite-plugin-file-hub',

    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },

    load(id) {
      if (id === resolvedVirtualModuleId) return generateModule({ groups: normalized });
    },
  };
};

export default factory;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/afei/github/vite-plugin-file-hub && bun test`
Expected: PASS (26 tests total)

- [ ] **Step 5: Commit**

```bash
git add src/index.ts __tests__/index.spec.ts
git commit -m "feat: add plugin factory with group validation and custom virtual id

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: README and full verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

````markdown
# vite-plugin-file-hub
> Zero-config glob discovery exposing project files as modules or raw strings.

[![version][version-image]][version-url]
[![license][license-image]][license-url]
[![size][size-image]][size-url]
[![download][download-image]][download-url]

## installation
```shell
npm install @jswork/vite-plugin-file-hub
```

## usage
```js
// vite.config.ts
import { defineConfig } from 'vite';
import fileHub from '@jswork/vite-plugin-file-hub';

export default defineConfig({
  plugins: [
    fileHub({
      groups: {
        // raw: file contents as strings
        locales: { globs: '/src/locales/*.json', mode: 'raw' },
        // module (default): each file imported as an ES module
        widgets: { globs: ['/src/widgets/*.tsx', '!/src/widgets/**/draft.tsx'] },
      },
    }),
  ],
});
```

```ts
// consume (runtime named exports)
import { locales, widgets } from 'virtual:file-hub';
// locales: Record<string, string>
// widgets: Record<string, any> — keyed by derived path keys
```

Keys derive from each path relative to the group's common root:
`date-picker.tsx` → `datePicker`, `user/index.tsx` → `user`, `confirm/delete/index.tsx` → `confirm.delete`.

## types
Add one line to `tsconfig.json` for global typing of the virtual module:
```json
{
  "compilerOptions": {
    "types": ["@jswork/vite-plugin-file-hub/client"]
  }
}
```
The shipped declaration exposes the default export (`import hub from 'virtual:file-hub'`).
For typed named exports, add your own ambient declaration:
```ts
declare module 'virtual:file-hub' {
  export const locales: Record<string, string>;
  export const widgets: Record<string, any>;
}
```

## options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `groups` | `Record<string, { globs: string \| string[]; mode?: 'module' \| 'raw' }>` | — (required) | Groups keyed by export name (valid JS identifiers) |
| `id` | `string` | `'virtual:file-hub'` | Virtual module id |

| Group option | Type | Default | Description |
|--------------|------|---------|-------------|
| `globs` | `string \| string[]` | — (required) | Globs relative to project root; `!` excludes supported |
| `mode` | `'module' \| 'raw'` | `'module'` | `module` = ES module imports, `raw` = content as string |

## license
Code released under [the MIT license](https://github.com/afeiship/vite-plugin-file-hub/blob/master/LICENSE.txt).

[version-image]: https://img.shields.io/npm/v/@jswork/vite-plugin-file-hub
[version-url]: https://npmjs.org/package/@jswork/vite-plugin-file-hub

[license-image]: https://img.shields.io/npm/l/@jswork/vite-plugin-file-hub
[license-url]: https://github.com/afeiship/vite-plugin-file-hub/blob/master/LICENSE.txt

[size-image]: https://img.shields.io/bundlephobia/minzip/@jswork/vite-plugin-file-hub
[size-url]: https://github.com/afeiship/vite-plugin-file-hub/blob/master/dist/index.min.js

[download-image]: https://img.shields.io/npm/dm/@jswork/vite-plugin-file-hub
[download-url]: https://www.npmjs.com/package/@jswork/vite-plugin-file-hub
````

- [ ] **Step 2: Run full test suite**

Run: `cd /Users/afei/github/vite-plugin-file-hub && bun test`
Expected: PASS, 0 fail (26 tests)

- [ ] **Step 3: Run build**

Run: `cd /Users/afei/github/vite-plugin-file-hub && pnpm build`
Expected: `dist/` contains `index.cjs.js`, `index.esm.js`, `index.d.ts`, `index.d.mts`; exit 0

- [ ] **Step 4: Verify built types resolve**

Run: `cd /Users/afei/github/vite-plugin-file-hub && ls dist`
Expected: files listed above present (sanity check; dts emitted without error)

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage, types and options

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

- [ ] **Step 6: Final status check**

Run: `cd /Users/afei/github/vite-plugin-file-hub && git log --oneline && git status`
Expected: 6 commits on `main`, clean working tree. **Do not push** — the user pushes to GitHub themselves.
