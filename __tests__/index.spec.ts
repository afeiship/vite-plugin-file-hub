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
