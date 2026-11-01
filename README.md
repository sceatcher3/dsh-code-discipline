# 写码纪律 · dsh-code-discipline

一个 DeepSeek Harness（DSH）host-only 插件：把“先读项目文档、先找现成轮子，再动手写”变成每一次动手写码前都在场的系统提示词约束。

## 它做什么

插件通过 `ctx.systemPrompt.section(...)` 注册一个固定段落：

- 名称：`dsh:code-discipline`
- 顺序：`order: 120`
- 插值：`interpolate: false`
- 文本：不随部署路径、预设或会话变化

段落要求模型在新增或修改会被执行/装载的文件（`.ts` `.js` `.py` `.sh`、`cordis.patch.yml`、插件 `package.json`、profile 配置），或安装插件、修改组合时，动手前先走一趟证据；同一任务只在第一次写码前走一次，纯文档与问答不触发：

1. **读文档**：从当前目录向上到仓库根读 `AGENTS.md` / `CLAUDE.md`（存在才读，最近一级优先），再读 `README` 的相关章节。
2. **找轮子**：`grep`/`glob` 一次本仓库有无现成实现；再 `search` 一次外部有无成熟包，命中就 `fetch` 读它的官方说明。
3. **复用或说明**：本仓库有就直接改，外部有就装上用，都没有才新造，并用一句话说明为何不用。
4. **不靠猜**：文档或搜索结果拿不准时换来源或先问。

末句写明优先级依据：取「有文档支持、可复用现有实现或现成轮子、改动最小且可验证」同时成立的那个；与所在预设给的轮数预算冲突时，这一趟只取一条最小证据就动手。

## 边界

- 只约束会被执行或装载的代码与插件安装动作；纯文档、问答不触发。
- 不拦截 `write`/`edit` 工具，也不要求模型额外调用某个查询工具。纪律段本身就是唯一载体。
- 不写死部署路径、工具名或技能名：读文档用文件工具，找轮子用本仓库检索加网页搜索，这些能力由当前预设提供，哪个预设缺哪一个都不该让纪律段指向不存在的工具。

设计取舍见 [ADR 0001：写码纪律以系统提示词段落注入，而非工具策略拦截](docs/adr/0001-code-discipline-system-prompt-section.md)；兼容范围的起点与理由见 [ADR 0002](docs/adr/0002-plugin-compatibility-engines-dsh.md)。

## 安装

这是一个 DSH 插件包，入口与组合补丁由 `package.json` 声明：

```json
{
  "main": "lib/index.js",
  "cordis": { "entry": "lib/index.js" },
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
}
```

`cordis.patch.yml` 把插件插入组合：

```yaml
- insert:
    - id: code-discipline
      name: 'dsh-code-discipline'
```

安装到 profile：

```bash
dsh plugin --profile <profile> add <package@version>
```

本地源码安装时把 `<package@version>` 换成目录路径。装完需要重启 DSH 才生效；重启后的下一轮对话开始注入纪律段。

### 兼容性

`package.json` 用 `engines.dsh` 声明兼容的 DSH 版本范围。DSH 0.2.1-alpha.3 起优先读它；只有缺失时才回退到 `@deepseek-ai/dsh*` peer 范围：

```json
{ "engines": { "dsh": ">=0.2.1-rc.2 <0.3.0" } }
```

安装与 profile 启动都会校验这个范围。不匹配时拒绝记录里的 `requirements` 字段会指出卡住的 `engines.dsh` 或 peer 包（旧版 DSH 里叫 `peers`）。

本机 DSH `0.2.1-rc.4` 下，本插件的补丁与任意预设补丁可用 `--patch` 叠加合成。插件只声明 DSH 版本范围，不对任何具体预设作出承诺：纪律段只用读文件、本仓库检索、网页搜索与抓取这类通用能力，不点名任何工具或技能，因此装进哪个预设都不该指向不存在的能力。换成某个预设时，用 `--patch` 把两者的补丁叠起来跑一次 `--dump-config` 即可确认合成通过，不受 profile 是否已登记本插件影响：

```bash
pnpm check -- --preset <预设补丁>.patch.yml
```

## 仓库结构

```text
.
├── lib/index.js                  # 插件实现：注册系统提示词段落
├── scripts/check-preset-parity.mjs  # 验收：文本不含预设专属能力，合成树可通过
├── locale/{zh,en}.json           # 插件市场显示文案
├── icon.svg                      # 插件图标
├── cordis.patch.yml              # 组合补丁
├── package.json                  # 包元数据与 peer 依赖
├── GLOSSARY.md                   # 本项目的领域词汇
└── docs/adr/                     # 架构决策记录
```

## 开发

要求 Node.js ESM 环境。无构建步骤，改完直接做语法检查与验收：

```bash
node --check lib/index.js
pnpm check
```

`pnpm check` 断言四件事：段落名与 `order` 未变；纪律段文本不含 `cordis_inspect_query`、`cordis-plugin-development`、`Config.listConfigs` 这类只在某个预设里成立的能力；给了 `--preset <补丁路径>` 时，该补丁能与本插件合成并通过 `--dump-config`；合成树里同时有 `dsh-tool-web` 与 `dsh-tool-fs-search`。要验证某个具体预设：

```bash
pnpm check -- --preset <预设补丁>.patch.yml
```

运行时依赖由 DSH 提供：

- `@deepseek-ai/cordis` `^4.0.1`
- `@deepseek-ai/dsh-system-prompt` `>=0.2.1-rc.2 <0.3.0`

## License

MIT
