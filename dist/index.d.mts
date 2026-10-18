import { Plugin } from 'vite';

interface FileHubGroupOptions {
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
interface FileHubPluginOptions {
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
declare const factory: (inOptions: FileHubPluginOptions) => Plugin;

export { type FileHubGroupOptions, type FileHubPluginOptions, factory as default };
