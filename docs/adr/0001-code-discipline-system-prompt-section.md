# 写码纪律以系统提示词段落注入，而非工具策略拦截

写码纪律要求每次写代码前先查一手文档、先找现有实现，因此它必须每轮都在场。我们把它做成 host-only 插件 `dsh-code-discipline`，通过 `ctx.systemPrompt.section({ name: 'dsh:code-discipline', order: 120, interpolate: false })` 注入一段固定的纪律文本。

没有选另外三条路：用工具策略拒绝对 `write`/`edit` 的调用（会与已启用的 `auto-review` 职责重叠，并且要靠拦截-重试来驱动，轮次成本高且容易误伤）；提供 `docs_lookup` 工具（只是给 `read`/`grep` 换名字，是否调用全凭模型自觉，违反"每次"）；写全局 `AGENTS.md` 或做成 skill（前者不随 profile 版本化且本机尚无该文件，后者只在被调用时载入，同样不满足"每次"）。

顺带定下两条边界：纪律文本里不写死任何部署路径（`packageDir` 随安装位置变化，一律写成 `Config.listConfigs` 的查找方法）；"写代码"只指会被执行或装载的文件与插件安装动作，纯文档与问答不触发。
