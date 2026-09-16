import type { CatalogItem, CatalogPayload, DataRecord } from './types';

let catalogPromise: Promise<CatalogItem[]> | undefined;
const entityPromises = new Map<string, Promise<DataRecord>>();

export function assetUrl(relativePath: string) {
  if (!relativePath) return '';
  const normalized = relativePath.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${normalized}`;
}

export function loadCatalog() {
  catalogPromise ||= fetch(assetUrl('generated/catalog.json'))
    .then((response) => {
      if (!response.ok) throw new Error(`目录加载失败：${response.status}`);
      return response.json() as Promise<CatalogPayload>;
    })
    .then((payload) => payload.items);
  return catalogPromise;
}

export function loadEntity(item: CatalogItem): Promise<DataRecord> {
  const cached = entityPromises.get(item.key);
  if (cached) return cached;

  const request = fetch(assetUrl(item.sourcePath))
    .then(async (response) => {
      if (!response.ok) throw new Error(`数据加载失败：${response.status}`);
      const json = await response.json() as unknown;
      const entity = findById(json, item.id);
      if (!entity) throw new Error(`未在 ${item.sourcePath} 中找到 ${item.id}`);
      return entity;
    })
    .catch((error) => {
      entityPromises.delete(item.key);
      throw error;
    });

  entityPromises.set(item.key, request);
  return request;
}

function findById(value: unknown, id: string): DataRecord | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if (!Array.isArray(value) && String((value as DataRecord).id) === id) return value as DataRecord;
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    const match = findById(child, id);
    if (match) return match;
  }
  return undefined;
}
