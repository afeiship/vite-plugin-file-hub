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
