import { computed, ref } from 'vue';
import type { Language } from '../types';
import entityTranslations from '../../translations/entities.zh-CN.json';
import uiTranslations from '../../translations/ui.zh-CN.json';

const saved = localStorage.getItem('clashdata-language');
const language = ref<Language>(saved === 'en' ? 'en' : 'zh-CN');
const entityMap = entityTranslations as Record<string, string>;
const ui = uiTranslations as { base: Record<string, string>; category: Record<string, string> };

const fieldLabels: Record<string, string> = {
  id: '标识', dataId: '数据 ID', base: '村庄', category: '分类', size: '占地尺寸',
  housingSpace: '所需空间', movementSpeed: '移动速度', range: '射程', attackSpeed: '攻击速度',
  damageType: '伤害类型', targetType: '目标类型', preferredTarget: '偏好目标', favoriteTarget: '偏好目标',
  hitpoints: '生命值', dps: '每秒伤害', damagePerShot: '单次伤害', damage: '伤害',
  townHallRequired: '所需大本营等级', builderHallRequired: '所需建筑大师大本营',
  laboratoryRequired: '所需实验室等级', starLabRequired: '所需星空实验室等级',
  researchCost: '升级费用', researchCostResource: '升级资源', researchTime: '升级时间',
  buildCost: '建造费用', buildCostResource: '建造资源', buildTime: '建造时间',
  upgradeCost: '升级费用', upgradeCostResource: '升级资源', upgradeTime: '升级时间',
  level: '等级', maxLevel: '最高等级', radius: '作用半径', duration: '持续时间',
  specialAbility: '特殊能力', rarity: '稀有度', hero: '所属英雄', abilityType: '能力类型',
  description: '说明', notes: '备注', resource: '资源', amount: '数量', count: '数量',
  seconds: '秒', minutes: '分钟', hours: '小时', days: '天', stats: '属性', modes: '模式',
};

export function useLanguage() {
  const isChinese = computed(() => language.value === 'zh-CN');
  const setLanguage = (value: Language) => {
    language.value = value;
    localStorage.setItem('clashdata-language', value);
    document.documentElement.lang = value;
  };
  const translate = (value: string) => isChinese.value ? entityMap[value] || value : value;
  const baseName = (value: string) => isChinese.value ? ui.base[value] || translate(value) : humanize(value);
  const categoryName = (value: string) => isChinese.value ? ui.category[value] || translate(value) : humanize(value);
  const fieldName = (value: string) => isChinese.value ? fieldLabels[value] || translate(value) : humanize(value);
  const text = (zh: string, en: string) => isChinese.value ? zh : en;
  return { language, isChinese, setLanguage, translate, baseName, categoryName, fieldName, text };
}

export function humanize(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}
