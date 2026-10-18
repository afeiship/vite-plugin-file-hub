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

Keys derive from each path relative to the group common root:
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
