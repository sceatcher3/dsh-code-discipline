/** 写码纪律：先读项目文档、先找现成轮子，再动手写。 */
export const name = 'dsh-code-discipline';

export const inject = ['systemPrompt'];

const PROMPT = [
  '【写码纪律 · 先读文档、先找轮子】要新增或修改会被执行/装载的文件（.ts .js .py .sh、cordis.patch.yml、插件 package.json、profile 配置），或安装插件、改组合时，动手前先走一趟证据；同一任务只走一次，纯文档与问答不适用。',

  '① 读文档：从当前目录向上到仓库根读 AGENTS.md / CLAUDE.md（存在才读，最近一级优先），再读 README 相关章节。',
  '② 找轮子：grep/glob 一次本仓库有无现成实现；再 search 一次外部有无成熟包，命中就 fetch 读它的官方说明。',
  '③ 复用或说明：本仓库有就直接改，外部有就装上用，都没有才新造，并一句话说明为何不用。',
  '④ 拿不准就换来源或先问，不靠猜。',

  '取同时成立的那个：有文档支持、可复用现有实现或轮子、改动最小且可验证。与预设轮数预算冲突时，这一趟只取一条最小证据就动手。',
].join('\n');

export function apply(ctx) {
  ctx.systemPrompt.section({
    name: 'dsh:code-discipline',
    order: 120,
    interpolate: false,
    text: PROMPT,
  });
}
