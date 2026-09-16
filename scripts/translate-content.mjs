import fs from 'node:fs';
import { ENTITY_TRANSLATIONS, allTranslatableStrings, loadTranslations } from './lib.mjs';

const required = allTranslatableStrings();
const translations = loadTranslations();
const overrides = {
  'Gold': '金币', 'Elixir': '圣水', 'Dark Elixir': '暗黑重油', 'Builder Gold': '建筑金币',
  'Builder Elixir': '建筑圣水', 'Capital Gold': '都城金币', 'Gems': '宝石', 'Raid Medals': '突袭奖章',
  'ground': '地面', 'air': '空中', 'air and ground': '空中和地面', 'single': '单体', 'multiple': '群体',
  'regular': '普通', 'super': '超级', 'common': '普通', 'rare': '稀有', 'epic': '史诗', 'legendary': '传奇',
  'Home Village': '家乡村庄', 'Builder Base': '建筑大师基地', 'Clan Capital': '部落都城',
  'Capital Peak': '都城之巅', 'Barbarian Camp': '野蛮人营地', 'Wizard Valley': '法师山谷',
  'Balloon Lagoon': '气球泻湖', 'Builder’s Workshop': '建筑工坊', 'Dragon Cliffs': '飞龙悬崖',
  'Golem Quarry': '戈仑石场', 'Skeleton Park': '骷髅公园', 'Goblin Mines': '哥布林矿井',
  'Barracks': '训练营', 'Bowler': '巨石投手', "Builder's Hut": '建筑工人小屋', 'Clan Castle': '部落城堡',
  'Dark Barracks': '暗黑训练营', 'Dark Elixir Drill': '暗黑重油钻井', 'Dark Elixir Storage': '暗黑重油罐',
  'Dark Spell Factory': '暗黑法术工厂', 'Elixir Collector': '圣水收集器', 'Elixir Storage': '圣水瓶',
  'Headhunter': '猎头者', 'Healer': '天使', 'Minion': '亡灵', 'Phoenix': '凤凰', 'Town Hall': '大本营',
  'Wall Breaker': '炸弹人', 'Wizard': '法师', 'Workshop': '攻城机器工坊', 'X-Bow': 'X连弩',
};
Object.assign(translations, overrides);
save();

const missing = required.filter((text) => !translations[text] || translations[text] === text);
let completed = 0;

function save() {
  const ordered = Object.fromEntries(Object.entries(translations).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(ENTITY_TRANSLATIONS, `${JSON.stringify(ordered, null, 2)}\n`);
}

const separator = '\n___CDSEP___\n';

async function request(text, attempt = 1) {
  const url = new URL('https://clients5.google.com/translate_a/t');
  url.searchParams.set('client', 'dict-chrome-ex');
  url.searchParams.set('sl', 'en');
  url.searchParams.set('tl', 'zh-CN');
  url.searchParams.set('q', text);
  try {
    const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const output = typeof payload?.[0] === 'string'
      ? payload[0].trim()
      : payload?.[0]?.map((part) => part?.[0] || '').join('').trim();
    if (!output) throw new Error('空翻译结果');
    return output;
  } catch (error) {
    if (attempt >= 5) throw error;
    await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
    return request(text, attempt + 1);
  }
}

const batches = [];
let batch = [];
let length = 0;
for (const text of missing) {
  if (batch.length && (batch.length >= 20 || length + text.length > 3400)) {
    batches.push(batch); batch = []; length = 0;
  }
  batch.push(text); length += text.length + separator.length;
}
if (batch.length) batches.push(batch);

for (const texts of batches) {
  const output = await request(texts.join(separator));
  const translated = output.split(/\s*___CDSEP___\s*/);
  if (translated.length !== texts.length) throw new Error(`批量翻译数量不一致：${texts.length} -> ${translated.length}`);
  texts.forEach((text, index) => { translations[text] = translated[index].trim(); });
  completed += texts.length;
  save();
  console.log(`翻译进度：${completed}/${missing.length}`);
  await new Promise((resolve) => setTimeout(resolve, 450));
}

save();
console.log(`翻译完成：共 ${required.length} 条。`);
