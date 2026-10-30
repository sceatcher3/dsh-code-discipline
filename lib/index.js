/** 写码纪律：先查一手文档、先找可复用实现，再动手写。 */
export const name = 'dsh-code-discipline';

export const inject = ['systemPrompt'];

const PROMPT = [
  '【写码纪律 · 文档优先】要新增或修改会被执行/装载的文件（.ts .js .py .sh、cordis.patch.yml、插件 package.json、profile 配置），或安装插件、改组合时，先走完四步。纯文档与问答不适用。',

  '① 定归属：先认出这段代码属于哪个生态 —— DSH 插件/组合、第三方库、本仓库自有实现。',
  '② 查一手文档，查到能写出具体 API 名与签名：',
  '   DSH 包 → cordis_inspect_query 的 Config.listConfigs(name=<包名>) 取 packageDir，读 README.md 与 lib/types/**/*.d.ts；写插件先加载 cordis-plugin-development skill，按其 "Knowledge sources, in order" 走。',
  '   第三方库 → web_fetch 读官方站点的 API 页。',
  '   本仓库 → 读 README 与相邻同类实现。',
  '   文档里找不到要用的 API 时，换文档或先问，不靠猜。',
  '③ 查本地：动手前 grep/glob 一次同类实现（同义词、近似命名、相邻目录）；能改的就改它，不另建。',
  '④ 交差：新造时用一句话回答"为什么现有实现不能改"；改完说清验证了什么（实跑、类型检查、观察到的输出）。',

  '方案取三者同时成立的那个：官方文档明确支持、能复用现有代码、改动最小且可验证。',
].join('\n');

export function apply(ctx) {
  ctx.systemPrompt.section({
    name: 'dsh:code-discipline',
    order: 120,
    interpolate: false,
    text: PROMPT,
  });
}
