import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { humanize } from './composables/useLanguage';

describe('Clash Data 内容索引', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'public/generated/catalog.json'), 'utf8')) as {
    items: Array<{ key: string; nameEn: string; nameZh: string; sourcePath: string; icon: string }>;
  };

  it('生成完整且路由唯一的目录', () => {
    expect(catalog.items.length).toBeGreaterThanOrEqual(500);
    expect(new Set(catalog.items.map((item) => item.key)).size).toBe(catalog.items.length);
  });

  it('目录条目提供中英文名称和按需数据路径', () => {
    expect(catalog.items.every((item) => item.nameEn && item.nameZh && item.sourcePath.startsWith('data/'))).toBe(true);
  });

  it('常用建筑条目可从等级数据生成卡片图片', () => {
    const factory = catalog.items.find((item) => item.key === 'home/army/dark-spell-factory');
    expect(factory?.icon).toMatch(/^images\//);
  });
});

describe('字段展示', () => {
  it('将驼峰字段转换为可读英文', () => {
    expect(humanize('researchCostResource')).toBe('Research Cost Resource');
  });
});
