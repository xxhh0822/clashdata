import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..');
export const DATA_DIR = path.join(ROOT, 'public', 'data');
export const IMAGE_DIR = path.join(ROOT, 'public', 'images');
export const ENTITY_TRANSLATIONS = path.join(ROOT, 'translations', 'entities.zh-CN.json');

export function walkFiles(directory, extension = '') {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full, extension));
    else if (!extension || entry.name.endsWith(extension)) files.push(full);
  }
  return files.sort();
}

export function relativePosix(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function loadTranslations() {
  return fs.existsSync(ENTITY_TRANSLATIONS) ? readJson(ENTITY_TRANSLATIONS) : {};
}

function findNamedObjects(value, found, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 5) return;
  if (!Array.isArray(value) && typeof value.id === 'string' && typeof value.name === 'string') {
    found.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) findNamedObjects(item, found, depth + 1);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'levels' || key === 'stats') continue;
    findNamedObjects(child, found, depth + 1);
  }
}

export function extractEntities(json) {
  const found = [];
  findNamedObjects(json, found);
  return found;
}

export function entityImage(entity) {
  const direct = entity?.images?.icon || firstImage(entity?.images) || entity?.image || entity?.icon || entity?.badge;
  if (direct) return direct;
  if (!Array.isArray(entity?.levels)) return '';
  for (let index = entity.levels.length - 1; index >= 0; index -= 1) {
    const levelImage = firstImage(entity.levels[index]?.images) || entity.levels[index]?.image || entity.levels[index]?.icon;
    if (levelImage) return levelImage;
  }
  return '';
}

function firstImage(images) {
  if (!images || typeof images !== 'object') return '';
  return Object.values(images).find((value) => typeof value === 'string' && value.startsWith('images/')) || '';
}

export function entityMaxLevel(entity) {
  if (!Array.isArray(entity?.levels) || entity.levels.length === 0) return null;
  const numbers = entity.levels.map((item) => Number(item?.level)).filter(Number.isFinite);
  return numbers.length ? Math.max(...numbers) : entity.levels.length;
}

export function entityTownHallLevels(entity) {
  if (!Array.isArray(entity?.levels)) return [];
  return [...new Set(entity.levels.flatMap((item) => [
    item?.townHallRequired,
    item?.builderHallRequired,
    item?.capitalHallRequired,
    item?.districtHallRequired,
  ]).map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
}

export function catalogFromData(translations = {}) {
  const items = [];
  const rootCategories = {
    achievements: 'achievement', clan: 'clan', 'ranked-battles': 'league', 'season-pass': 'season-pass',
  };
  for (const file of walkFiles(DATA_DIR, '.json')) {
    const sourcePath = relativePosix(DATA_DIR, file);
    const [pathBase, pathCategory = 'other'] = sourcePath.split('/');
    for (const entity of extractEntities(readJson(file))) {
      const base = pathBase;
      const category = String(entity.category || rootCategories[pathBase] || pathCategory.replace(/\.json$/, '').replace(/s$/, ''));
      const id = String(entity.id);
      items.push({
        key: `${base}/${category}/${id}`,
        id,
        dataId: entity.dataId ?? null,
        base,
        category,
        sourcePath: `data/${sourcePath}`,
        nameEn: entity.name,
        nameZh: translations[entity.name] || entity.name,
        descriptionEn: entity.description || '',
        icon: entityImage(entity),
        maxLevel: entityMaxLevel(entity),
        requiredLevels: entityTownHallLevels(entity),
      });
    }
  }
  return items.sort((a, b) => a.base.localeCompare(b.base) || a.category.localeCompare(b.category) || a.nameEn.localeCompare(b.nameEn));
}

const translatableKeys = new Set([
  'name', 'description', 'notes', 'specialAbility', 'requirement', 'unlockRequirement',
  'preferredTarget', 'favoriteTarget', 'abilityType', 'itemType', 'type', 'group',
  'leagueGroup', 'targetType', 'damageType', 'attackType', 'troopType', 'rarity',
  'resource', 'buildCostResource', 'upgradeCostResource', 'researchCostResource',
  'costResource', 'boostCostResource', 'district', 'unlockedUnit', 'unlockedSpell',
  'unlockedPet', 'unlockedSiegeMachine', 'equipmentUnlocked', 'troopUnlocked'
]);

export function collectTranslatableStrings(value, result = new Set(), key = '') {
  if (typeof value === 'string') {
    if (translatableKeys.has(key) && value.trim()) result.add(value.trim());
    return result;
  }
  if (Array.isArray(value)) for (const child of value) collectTranslatableStrings(child, result, key);
  else if (value && typeof value === 'object') for (const [childKey, child] of Object.entries(value)) collectTranslatableStrings(child, result, childKey);
  return result;
}

export function allTranslatableStrings() {
  const strings = new Set();
  for (const file of walkFiles(DATA_DIR, '.json')) collectTranslatableStrings(readJson(file), strings);
  return [...strings].sort((a, b) => a.localeCompare(b));
}

export function collectImageReferences(value, result = new Set()) {
  if (typeof value === 'string' && value.startsWith('images/')) result.add(value);
  else if (Array.isArray(value)) for (const child of value) collectImageReferences(child, result);
  else if (value && typeof value === 'object') for (const child of Object.values(value)) collectImageReferences(child, result);
  return result;
}
