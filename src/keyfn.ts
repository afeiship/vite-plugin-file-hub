/**
 * Derive the registration key for a file path.
 * Must stay free of TS-only syntax and closure dependencies: this function is
 * injected into the generated virtual module via `deriveKey.toString()`.
 * @param path - Glob-matched path, e.g. `/src/widgets/date-picker.tsx`
 * @param root - Group root prefix, e.g. `/src/widgets/`
 */
export const deriveKey = (path, root) => {
  const rel = path.startsWith(root) ? path.slice(root.length) : path;
  const segments = rel.split('/').filter(Boolean);
  const last = segments.length - 1;
  const noExt = segments[last].replace(/(?!^\.)\.[^/.]+$/, '');
  segments[last] = noExt || segments[last];
  if (segments[last] === 'index') segments.pop();
  if (segments.length === 0) segments.push('index');
  return segments
    .map((seg) => seg.replace(/[^a-zA-Z0-9]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[^a-zA-Z0-9]+/, ''))
    .join('.');
};
