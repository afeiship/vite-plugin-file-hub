"use strict";Object.defineProperty(exports, "__esModule", {value: true});

var _chunkIEOHVGU7cjsjs = require('./chunk-IEOHVGU7.cjs.js');

// src/codegen.ts
var commonRoot = (patterns) => {
  const roots = patterns.filter((p) => !p.startsWith("!")).map((p) => {
    const star = p.indexOf("*");
    return star === -1 ? p : p.slice(0, star);
  });
  let prefix = roots[0] || "/";
  for (const r of roots) {
    while (!r.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  const idx = prefix.lastIndexOf("/");
  return idx <= 0 ? "/" : prefix.slice(0, idx + 1);
};
var generateModule = (options) => {
  const specs = Object.entries(options.groups).map(([name, group]) => ({
    name,
    globs: group.globs,
    root: commonRoot(group.globs),
    raw: group.mode === "raw"
  }));
  return _chunkIEOHVGU7cjsjs.buildModule.call(void 0, specs);
};




exports.commonRoot = commonRoot; exports.generateModule = generateModule;
//# sourceMappingURL=chunk-WEHWUTNT.cjs.js.map