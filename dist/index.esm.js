import {
  generateModule
} from "./chunk-B5RDLZKX.esm.js";
import "./chunk-PYCYGOSX.esm.js";
import "./chunk-V7RQGFJW.esm.js";

// src/index.ts
var toArr = (value) => Array.isArray(value) ? value : [value];
var IDENT_RE = /^[A-Za-z_$][\w$]*$/;
var factory = (inOptions) => {
  var _a, _b;
  const groups = inOptions == null ? void 0 : inOptions.groups;
  if (!groups || Object.keys(groups).length === 0) {
    throw new Error("[vite-plugin-file-hub] options.groups is required (at least one group).");
  }
  const normalized = {};
  for (const [name, group] of Object.entries(groups)) {
    if (!IDENT_RE.test(name)) {
      throw new Error(`[vite-plugin-file-hub] invalid group name "${name}": must be a valid JS identifier.`);
    }
    if (!(group == null ? void 0 : group.globs)) {
      throw new Error(`[vite-plugin-file-hub] group "${name}" requires globs.`);
    }
    normalized[name] = { globs: toArr(group.globs), mode: (_a = group.mode) != null ? _a : "module" };
  }
  const virtualModuleId = (_b = inOptions == null ? void 0 : inOptions.id) != null ? _b : "virtual:file-hub";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  return {
    name: "vite-plugin-file-hub",
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) return generateModule({ groups: normalized });
    }
  };
};
var index_default = factory;
export {
  index_default as default
};
//# sourceMappingURL=index.esm.js.map