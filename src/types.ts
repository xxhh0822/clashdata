export type Language = 'zh-CN' | 'en';

export interface CatalogItem {
  key: string;
  id: string;
  dataId: number | string | null;
  base: string;
  category: string;
  sourcePath: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  icon: string;
  thumbnail?: string;
  maxLevel: number | null;
  requiredLevels: number[];
}

export interface CatalogPayload {
  generatedAt: string;
  items: CatalogItem[];
}

export type DataRecord = Record<string, unknown>;
