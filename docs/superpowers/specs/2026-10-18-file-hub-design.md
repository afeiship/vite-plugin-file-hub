# vite-plugin-file-hub 设计文档

日期: 2026-10-18
状态: 已评审通过

## 背景与目标

`@jswork/vite-plugin-react-modal-hub` 的核心链路是：glob 文件发现 → key 推导 → 虚拟模块 codegen。该链路与 React Modal 领域无关，可以泛化为一个通用的文件读取工具。

新项目 `@jswork/vite-plugin-file-hub`：通过 glob 扫描项目文件，在一个虚拟模块中把文件分组导出——既支持作为 ES 模块导入（组件、路由、插件注册表），也支持读取为原始文本字符串（markdown、i18n locale、配置文件）。

## 交付物

- **项目名**: `@jswork/vite-plugin-file-hub`（仓库名 `vite-plugin-file-hub`，虚拟模块 id `virtual:file-hub`）
- **英文 description**（10 词）: `Zero-config glob discovery exposing project files as modules or raw strings.`
- **通用插件实现**: 新建独立项目 `/Users/afei/github/vite-plugin-file-hub`

## API

```ts
export interface FileHubGroupOptions {
  /** Glob(s) relative to project root; `!` excludes supported. */
  globs: string | string[];
  /** Export form. `module` = ES module imports; `raw` = file content as string. */
  mode?: 'module' | 'raw'; // default: 'module'
}

export interface FileHubPluginOptions {
  /** At least one group. Keys become export names on the virtual module. */
  groups: Record<string, FileHubGroupOptions>;
  /** Virtual module id. @default 'virtual:file-hub' */
  id?: string;
}

export default function fileHub(options: FileHubPluginOptions): Plugin;
```

使用示例：

```ts
// vite.config.ts
import fileHub from '@jswork/vite-plugin-file-hub';

export default defineConfig({
  plugins: [
    fileHub({
      groups: {
        locales: { globs: '/src/locales/*.json', mode: 'raw' },
        widgets: { globs: ['/src/widgets/*.tsx', '!/src/widgets/**/draft.tsx'] },
      },
    }),
  ],
});
```

```ts
// 消费方（运行时具名导出可用；需要静态类型时用 default 解构，见「类型声明」）
import hub, { locales, widgets } from 'virtual:file-hub';
// locales: Record<string, string>   (raw)
// widgets: Record<string, any>      (module, default export)
```

## 生成的虚拟模块

每组生成一个 `import.meta.glob` 调用：

- `mode: 'module'` → `{ eager: true }`
- `mode: 'raw'` → `{ eager: true, query: '?raw', import: 'default' }`

```js
const localesFiles = import.meta.glob(["/src/locales/*.json"], { eager: true, query: '?raw', import: 'default' });
const widgetsFiles = import.meta.glob(["/src/widgets/*.tsx", "!/src/widgets/**/draft.tsx"], { eager: true });

export const locales = toMap(localesFiles, "/src/locales/", deriveKey);
export const widgets = toMap(widgetsFiles, "/src/widgets/", deriveKey);
export default { locales, widgets };
```

## 架构

新项目文件结构与本项目一一对应，直接移植四个模块：

| 文件 | 职责 | 来源 |
|------|------|------|
| `src/index.ts` | 插件工厂：校验 options、`resolveId`/`load` 拦截虚拟模块 | 改造（去掉 modal 语义，改为 groups） |
| `src/codegen.ts` | `commonRoot` + `generateModule`（遍历 groups 生成每组 glob） | 改造（单组 → 多组） |
| `src/template.ts` | `toMap` + `buildModule`（`toString()` 注入运行时函数） | 移植（`toMap` 原样，`buildModule` 改为 per-group 循环） |
| `src/keyfn.ts` | `deriveKey`：去扩展名、index 折叠、点号连接、camelCase | 原样移植 |

### key 推导规则（沿用）

`/src/widgets/confirm/delete/index.tsx` + root `/src/widgets/` → `confirm.delete`；`date-picker.tsx` → `datePicker`。所有组共用同一套规则。

### 约束（沿用本项目经验）

- `toMap` / `deriveKey` 通过 `toString()` 注入虚拟模块，必须保持无 TS 语法、无闭包依赖，依赖一律显式传参
- `!` 排除模式保留在 glob 中，但从 `commonRoot` 推导中剔除

## 错误处理

- `options.groups` 缺失或为空对象 → 工厂函数抛出 `Error('[vite-plugin-file-hub] options.groups is required')`
- group 值缺少 `globs` → 同样抛错
- 重复 key → 沿用 `toMap` 的 `console.warn` 警告并覆盖，不中断

## 非目标（YAGNI）

- per-group 自定义 `keyFn`
- 懒加载 loader 模式（`eager: false` 返回 import 函数）
- 默认 glob（通用插件没有合理默认）
- 多实例多虚拟模块（`id` 选项已覆盖；多实例场景由用户按需传不同 `id`）

## 类型声明

group 名是运行时配置，TS 无法为任意具名导出生成静态声明。采用**静态 client.d.ts + default 导出**方案（标准 virtual module 插件模式，不使用 emitFile 生成 d.ts——TS 不会自动解析插件 emit 的声明文件，属于过度设计）：

```ts
// client.d.ts
declare module 'virtual:file-hub' {
  type FileMap = Record<string, any>;
  type FileHub = Record<string, FileMap>;
  const hub: FileHub;
  export default hub;
}
```

消费方式：`import hub from 'virtual:file-hub'; const { locales, widgets } = hub;`

需要具名导出类型的项目可在自己的 `client.d.ts` 里补一段 ambient 声明（README 提供现成片段）：

```ts
declare module 'virtual:file-hub' {
  export const locales: Record<string, string>;
  export const widgets: Record<string, any>;
}
```

自定义 `id` 的插件实例不受 `client.d.ts` 覆盖，消费方按实际 id 自行声明模块。

## 测试策略

`__tests__/index.spec.ts`，bun test，镜像本项目测试结构：

1. `deriveKey` — 6 个用例原样移植（plain/kebab/index 折叠/子目录/空回退）
2. `commonRoot` — 5 个用例原样移植（含 `!` 排除）
3. `generateModule` — 断言 module 组、raw 组（`query: '?raw'`）、默认导出形状、重复 key 警告
4. 插件工厂 — name/resolveId/load 钩子、自定义 `id`、空 groups 抛错、缺 globs 抛错

验证方式：`pnpm build && pnpm test` 全绿。

## 项目结构与工具链

```
vite-plugin-file-hub/
├── src/{index,codegen,template,keyfn}.ts
├── __tests__/index.spec.ts
├── client.d.ts
├── tsup.config.ts
├── tsconfig.json
├── package.json          # pnpm, tsup + bun test + release-it
├── README.md
├── LICENSE.txt
└── docs/superpowers/specs/2026-10-18-file-hub-design.md
```

工具链与 `vite-plugin-react-modal-hub` 完全一致：tsup（cjs+esm+dts）、bun test、release-it。README 结构镜像本项目（installation / usage / types / options / license）。`.gitignore` 含 `node_modules`、`dist`、`.superpowers`。
