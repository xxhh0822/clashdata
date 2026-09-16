import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './lib.mjs';

const sourceFlag = process.argv.indexOf('--source');
const sourceArg = sourceFlag >= 0 ? process.argv[sourceFlag + 1] : '../clash-of-clans-data';
const sourceRoot = path.resolve(ROOT, sourceArg);
const targetPublic = path.join(ROOT, 'public');

if (sourceRoot === ROOT || !fs.existsSync(path.join(sourceRoot, 'data')) || !fs.existsSync(path.join(sourceRoot, 'images'))) {
  throw new Error(`无效的数据源目录：${sourceRoot}`);
}

for (const name of ['data', 'images']) {
  const source = path.join(sourceRoot, name);
  const target = path.join(targetPublic, name);
  if (!target.startsWith(`${targetPublic}${path.sep}`)) throw new Error(`拒绝清理异常路径：${target}`);
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
}

const license = path.join(sourceRoot, 'LICENSE');
if (fs.existsSync(license)) fs.copyFileSync(license, path.join(ROOT, 'THIRD_PARTY_LICENSE'));

const generated = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'generate-content.mjs')], { stdio: 'inherit' });
if (generated.status !== 0) process.exit(generated.status ?? 1);
console.log(`数据已从 ${sourceRoot} 同步完成。`);
