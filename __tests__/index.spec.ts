import vitePlugin from '../src';
import { deriveKey } from '../src/keyfn';
import { commonRoot, generateModule } from '../src/codegen';

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

  test('preserves dotfiles: .hidden.tsx → Hidden', () => {
    expect(deriveKey('/src/modals/.hidden.tsx', '/src/modals/')).toBe('Hidden');
  });

  test('no extension: login → login', () => {
    expect(deriveKey('/src/modals/login', '/src/modals/')).toBe('login');
  });

  test('multi dash / space collapse: foo--bar baz.tsx → fooBarBaz', () => {
    expect(deriveKey('/src/modals/foo--bar baz.tsx', '/src/modals/')).toBe('fooBarBaz');
  });

  test('root not prefix: falls through', () => {
    expect(deriveKey('/src/other/login.tsx', '/src/modals/')).toBe('src.other.login');
  });

  test('root is /: uses full path', () => {
    expect(deriveKey('/src/modals/login.tsx', '/')).toBe('src.modals.login');
  });
});

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

describe('generateModule', () => {
  test('emits eager module glob for module group with derived root', () => {
    const code = generateModule({ groups: { widgets: { globs: ['/src/widgets/*.tsx'] } } });
    expect(code).toContain(
      'const widgetsFiles = import.meta.glob(["/src/widgets/*.tsx"], { eager: true })',
    );
    expect(code).toContain('export const widgets = toMap(widgetsFiles, "/src/widgets/", deriveKey)');
    expect(code).toContain('export default { widgets };');
  });

  test('emits raw glob with query for raw group', () => {
    const code = generateModule({
      groups: { locales: { globs: ['/src/locales/*.json'], mode: 'raw' } },
    });
    expect(code).toContain(
      "const localesFiles = import.meta.glob([\"/src/locales/*.json\"], { eager: true, query: '?raw', import: 'default' })",
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
    expect(code).toContain(
      'import.meta.glob(["/src/widgets/*.tsx","!/src/widgets/**/draft.tsx"], { eager: true })',
    );
    expect(code).toContain('toMap(widgetsFiles, "/src/widgets/", deriveKey)');
  });
});

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
      'invalid group name',
    );
  });

  test('resolveId hits virtual:file-hub and misses others', () => {
    const plugin = vitePlugin({ groups: { widgets: { globs: '/src/widgets/*.tsx' } } });
    const resolveId = plugin.resolveId as any;
    expect(resolveId.call({} as any, 'virtual:file-hub')).toBe('\0virtual:file-hub');
    expect(resolveId.call({} as any, 'other-module')).toBeUndefined();
  });

  test('resolveId honors a custom id', () => {
    const plugin = vitePlugin({
      groups: { widgets: { globs: '/src/*.tsx' } },
      id: 'virtual:my-hub',
    });
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
      "const localesFiles = import.meta.glob([\"/src/locales/*.json\"], { eager: true, query: '?raw', import: 'default' })",
    );
    expect(code).toContain(
      'import.meta.glob(["/src/widgets/*.tsx","!/src/widgets/**/draft.tsx"], { eager: true })',
    );
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
