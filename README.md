# 写码纪律 · dsh-code-discipline

一个 DeepSeek Harness（DSH）host-only 插件：把“先查一手文档、先找现有实现，再动手写”变成每一轮都在场的系统提示词约束。

## 它做什么

插件通过 `ctx.systemPrompt.section(...)` 注册一个固定段落：

- 名称：`dsh:code-discipline`
- 顺序：`order: 120`
- 插值：`interpolate: false`
- 文本：不随部署路径或会话变化

段落要求模型在新增或修改会被执行/装载的文件（`.ts` `.js` `.py` `.sh`、`cordis.patch.yml`、插件 `package.json`、profile 配置），或安装插件、修改组合时，先完成四步：

1. **定归属**：判断代码属于 DSH 插件/组合、第三方库，还是本仓库自有实现。
2. **查一手文档**：查到能写出具体 API 名与签名；DSH 包先取 `packageDir` 再读 README 与类型声明，第三方库读官方 API 页，本仓库读 README 与相邻实现。
3. **查本地**：动手前用 `grep`/`glob` 找同类实现，能改现成的就不另建。
4. **交差**：新造时说明“为什么现有实现不能改”，改完说明验证了什么。

方案取三者同时成立的那个：官方文档明确支持、能复用现有代码、改动最小且可验证。

## 边界

- 只约束会被执行或装载的代码与插件安装动作；纯文档、问答不触发。
- 不拦截 `write`/`edit` 工具，也不要求模型额外调用某个查询工具。纪律段本身就是唯一载体。
- 不在提示词里写死任何部署路径；查找 DSH 包一律走运行时的 `Config.listConfigs` 方法。

设计取舍见 [ADR 0001：写码纪律以系统提示词段落注入，而非工具策略拦截](docs/adr/0001-code-discipline-system-prompt-section.md)。

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

安装到当前 DSH profile 后，插件会在下一轮对话注入纪律段。具体安装命令随 DSH 版本变化，以所用版本的插件文档为准。

## 仓库结构

```text
.
├── lib/index.js                  # 插件实现：注册系统提示词段落
├── locale/{zh,en}.json           # 插件市场显示文案
├── icon.svg                      # 插件图标
├── cordis.patch.yml              # 组合补丁
├── package.json                  # 包元数据与 peer 依赖
├── GLOSSARY.md                   # 本项目的领域词汇
└── docs/adr/                     # 架构决策记录
```

## 开发

要求 Node.js ESM 环境。无构建步骤，改完直接做语法检查：

```bash
node --check lib/index.js
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
```

运行时依赖由 DSH 提供：

- `@deepseek-ai/cordis` `^4.0.1`
- `@deepseek-ai/dsh-system-prompt` `0.2.1-rc.2`

## License

MIT
