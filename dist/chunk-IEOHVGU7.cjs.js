"use strict";Object.defineProperty(exports, "__esModule", {value: true});

var _chunkVXQCSLQ5cjsjs = require('./chunk-VXQCSLQ5.cjs.js');

// src/template.ts
function toMap(files, root, deriveKey2) {
  const map = {};
  for (const path of Object.keys(files)) {
    const key = deriveKey2(path, root);
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      console.warn('[vite-plugin-file-hub] duplicate file key "' + key + '" from "' + path + '", overwritten.');
    }
    const mod = files[path];
    map[key] = mod.default || mod;
  }
  return map;
}
var buildModule = (groups) => {
  const globLines = groups.map((g) => {
    const opts = g.raw ? `{ eager: true, query: '?raw', import: 'default' }` : `{ eager: true }`;
    return `const ${g.name}Files = import.meta.glob(${JSON.stringify(g.globs)}, ${opts});`;
  }).join("\n");
  const exportLines = groups.map(
    (g) => `export const ${g.name} = toMap(${g.name}Files, ${JSON.stringify(g.root)}, deriveKey);`
  ).join("\n");
  const names = groups.map((g) => g.name).join(", ");
  return `
const deriveKey = ${_chunkVXQCSLQ5cjsjs.deriveKey.toString()};
const toMap = ${toMap.toString()};

${globLines}

${exportLines}
export default { ${names} };
`.trim();
};




exports.toMap = toMap; exports.buildModule = buildModule;
//# sourceMappingURL=chunk-IEOHVGU7.cjs.js.map