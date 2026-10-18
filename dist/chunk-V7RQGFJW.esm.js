// src/keyfn.ts
var deriveKey = (path, root) => {
  const rel = path.startsWith(root) ? path.slice(root.length) : path;
  const segments = rel.split("/").filter(Boolean);
  const last = segments.length - 1;
  const noExt = segments[last].replace(/(?!^\.)\.[^/.]+$/, "");
  segments[last] = noExt || segments[last];
  if (segments[last] === "index") segments.pop();
  if (segments.length === 0) segments.push("index");
  return segments.map((seg) => seg.replace(/[^a-zA-Z0-9]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[^a-zA-Z0-9]+/, "")).join(".");
};

export {
  deriveKey
};
//# sourceMappingURL=chunk-V7RQGFJW.esm.js.map