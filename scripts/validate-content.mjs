import fs from 'node:fs';
import path from 'node:path';
import { ROOT, DATA_DIR, walkFiles, readJson, collectImageReferences, catalogFromData, loadTranslations } from './lib.mjs';

const missing = [];
let references = 0;
for (const file of walkFiles(DATA_DIR, '.json')) {
  for (const image of collectImageReferences(readJson(file))) {
    references += 1;
    if (!fs.existsSync(path.join(ROOT, 'public', ...image.split('/')))) missing.push(`${image}（引用自 ${path.relative(DATA_DIR, file)}）`);
  }
}

const catalog = catalogFromData(loadTranslations());
const keys = new Set();
const duplicates = [];
for (const item of catalog) {
  if (keys.has(item.key)) duplicates.push(item.key);
  keys.add(item.key);
}

if (missing.length || duplicates.length) {
  if (missing.length) console.error(`缺少 ${missing.length} 个图片引用：\n${missing.slice(0, 30).join('\n')}`);
  if (duplicates.length) console.error(`存在重复路由：\n${duplicates.join('\n')}`);
  process.exit(1);
}
console.log(`数据校验通过：${walkFiles(DATA_DIR, '.json').length} 个 JSON、${references} 个图片引用、${catalog.length} 个目录条目。`);
