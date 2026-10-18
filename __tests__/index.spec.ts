import { deriveKey } from '../src/keyfn';
import { commonRoot } from '../src/codegen';

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
