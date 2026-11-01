// 验收脚本：纪律段不能依赖某个预设才有的能力，且必须能与给定预设补丁合成。
// 用法：node scripts/check-preset-parity.mjs [--preset <patch.yml>] [--profile web]
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const preset = option('--preset', undefined);
const profile = option('--profile', 'web');
const dshBin = process.env.DSH_BIN ?? 'dsh';

const failures = [];
const check = (ok, label, detail) => {
  if (ok) console.log(`ok   ${label}`);
  else {
    failures.push(label);
    console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

// 1. 从源码取出纪律段文本（PROMPT 未导出，按字面量还原）
const source = readFileSync(resolve(root, 'lib/index.js'), 'utf8');
const start = source.indexOf('const PROMPT = [');
const end = source.indexOf('].join(', start);
if (start < 0 || end < 0) {
  console.log('FAIL 找不到 PROMPT 文本块 — lib/index.js 结构变了');
  process.exit(1);
}
const literals = [...source.slice(start, end).matchAll(/'((?:[^'\\]|\\.)*)'/g)]
  .map((m) => m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
const prompt = literals.join('\n');

check(/name: 'dsh:code-discipline'/.test(source), '段落名未变');
check(/order: 120/.test(source), 'order 未变');
check(/interpolate: false/.test(source), 'interpolate 未变');

// 2. 纪律段不得指向只在个别预设里存在的能力
const forbidden = [
  ['cordis_inspect_query', 'cordis_inspect_query'],
  ['plugin-development', 'cordis-plugin-development'],
  ['Config.listConfigs', 'Config.listConfigs'],
];
for (const [token, label] of forbidden) {
  check(!prompt.includes(token), `纪律段不含 ${label}`);
}

// 3. 文本预算（0.2.0 定为 420 字符，含标题行）
check(prompt.length <= 420, `纪律段长度 ${prompt.length} ≤ 420`);

// 4. 本插件自己的补丁能进树，且只有一行
const dump = (patches) => {
  const run = spawnSync(dshBin, ['--profile', profile, ...patches.flatMap((p) => ['--patch', p]), '--dump-config'], {
    cwd: root,
    encoding: 'utf8',
  });
  return { status: run.status, text: `${run.stdout ?? ''}${run.stderr ?? ''}`, stderr: (run.stderr ?? '').split('\n')[0] };
};
const own = dump([resolve(root, 'cordis.patch.yml')]);
check(own.status === 0, `本插件补丁 --dump-config 退出码 ${own.status ?? 'null'}`, own.stderr);
check((own.text.match(/id: code-discipline/g) ?? []).length === 1, '合成树含且仅含一行 code-discipline');

// 5. 与给定预设补丁叠加（未给 --preset 时跳过）
if (preset === undefined) {
  console.log('skip 预设叠加验证（未给 --preset）');
} else {
  const both = dump([resolve(root, 'cordis.patch.yml'), resolve(preset)]);
  check(both.status === 0, `叠加后 --dump-config 退出码 ${both.status ?? 'null'}`, both.stderr);
  check((both.text.match(/id: code-discipline/g) ?? []).length === 1, '叠加后 code-discipline 行不重复');
  check(/- id: preset-/.test(both.text), '叠加后含预设行');
  check(/name: '@deepseek-ai\/dsh-tool-web'/.test(both.text), '叠加树提供网页搜索/抓取');
  check(/name: '@deepseek-ai\/dsh-tool-fs-search'/.test(both.text), '叠加树提供本仓库检索');
}

if (failures.length > 0) {
  console.log(`\n${failures.length} 项未通过`);
  process.exit(1);
}
console.log('\n全部通过');
