declare module 'virtual:file-hub' {
  type FileMap = Record<string, any>;
  type FileHub = Record<string, FileMap>;
  const hub: FileHub;
  export default hub;
}
