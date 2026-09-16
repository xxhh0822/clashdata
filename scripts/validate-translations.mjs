import fs from 'node:fs';
import path from 'node:path';
import { ROOT, allTranslatableStrings, loadTranslations } from './lib.mjs';

const translations = loadTranslations();
const required = allTranslatableStrings();
const missing = required.filter((text) => !translations[text] || translations[text] === text);
fs.writeFileSync(path.join(ROOT, 'translation-report.json'), `${JSON.stringify({ required: required.length, translated: required.length - missing.length, missing }, null, 2)}\n`);
if (missing.length) {
  console.error(`缺少 ${missing.length} 条中文翻译，详见 translation-report.json。`);
  process.exit(1);
}
console.log(`翻译校验通过：${required.length} 条。`);
