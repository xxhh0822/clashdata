<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router';
import {
  BookOpen, Castle, ChartBar, ChevronLeft, ChevronRight, Flask, Home, Medal,
  Refresh, ShieldStar,
} from '../icons';
import { assetUrl, loadCatalog, loadEntity } from '../data';
import type { CatalogItem, DataRecord } from '../types';
import { useLanguage } from '../composables/useLanguage';
import ItemCard from '../components/ItemCard.vue';
import LoadingState from '../components/LoadingState.vue';
import EmptyState from '../components/EmptyState.vue';
import SelectMenu from '../components/SelectMenu.vue';

const route = useRoute();
const router = useRouter();
const items = ref<CatalogItem[]>([]);
const loading = ref(true);
const entity = ref<DataRecord>();
const entityLoading = ref(false);
const entityError = ref('');
const typeFilter = ref('all');
const sort = ref('name');
const page = ref(1);
const selectedLevel = ref(0);
const levelStrip = ref<HTMLElement>();
let entityRequest = 0;
const PAGE_SIZE = 12;

const { language, translate, baseName, categoryName, text } = useLanguage();
const sections = [
  { key: 'home', icon: Home, zh: '家乡村庄', en: 'Home Village' },
  { key: 'builder', icon: ShieldStar, zh: '建筑大师基地', en: 'Builder Base' },
  { key: 'clan-capital', icon: Castle, zh: '部落都城', en: 'Clan Capital' },
  { key: 'magic-items', icon: Flask, zh: '魔法物品', en: 'Magic Items' },
  { key: 'clan', icon: ShieldStar, zh: '部落', en: 'Clans' },
  { key: 'achievements', icon: Medal, zh: '成就', en: 'Achievements' },
  { key: 'ranked-battles', icon: ChartBar, zh: '排位战', en: 'Ranked Battles' },
  { key: 'season-pass', icon: BookOpen, zh: '赛季通行证', en: 'Season Pass' },
];

const isSearch = computed(() => route.name === 'search');
const query = computed(() => String(route.query.q || '').trim());
const activeBase = computed(() => String(route.params.base || 'home'));
const scopeCategory = computed(() => String(route.params.category || 'all'));
const counts = computed(() => Object.fromEntries(sections.map(({ key }) => [key, items.value.filter((item) => item.base === key).length])));
const scopedItems = computed(() => {
  if (isSearch.value) {
    const needle = query.value.toLocaleLowerCase();
    if (!needle) return [];
    return items.value.filter((item) => [item.nameZh, item.nameEn, item.id, String(item.dataId || '')]
      .some((value) => value.toLocaleLowerCase().includes(needle)));
  }
  return items.value.filter((item) => item.base === activeBase.value && (scopeCategory.value === 'all' || item.category === scopeCategory.value));
});
const categories = computed(() => [...new Set(scopedItems.value.map((item) => item.category))].sort());
const typeOptions = computed(() => [
  { value: 'all', label: text('全部类型', 'All types') },
  ...categories.value.map((category) => ({ value: category, label: categoryName(category) })),
]);
const sortOptions = computed(() => [
  { value: 'name', label: text('按名称', 'By name') },
  { value: 'level', label: text('按最高等级', 'By max level') },
]);
const filtered = computed(() => {
  const result = scopedItems.value.filter((item) => typeFilter.value === 'all' || item.category === typeFilter.value);
  return [...result].sort((a, b) => sort.value === 'level'
    ? (b.maxLevel || 0) - (a.maxLevel || 0)
    : (language.value === 'zh-CN' ? a.nameZh.localeCompare(b.nameZh, 'zh-CN') : a.nameEn.localeCompare(b.nameEn)));
});
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));
const pageItems = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));
const routedItem = computed(() => {
  const searchKey = String(route.query.item || '');
  if (isSearch.value && searchKey) return items.value.find((item) => item.key === searchKey);
  const id = String(route.params.id || '');
  return id ? items.value.find((item) => item.base === activeBase.value && item.id === id) : undefined;
});
const selectedItem = computed(() => {
  const candidate = routedItem.value;
  return candidate && filtered.value.some((item) => item.key === candidate.key) ? candidate : pageItems.value[0];
});
const levels = computed(() => Array.isArray(entity.value?.levels) ? entity.value.levels as DataRecord[] : []);
const activeLevel = computed(() => levels.value[selectedLevel.value] || entity.value);
const displayName = computed(() => selectedItem.value ? (language.value === 'zh-CN' ? selectedItem.value.nameZh : selectedItem.value.nameEn) : '');
const description = computed(() => {
  const original = String(entity.value?.description || selectedItem.value?.descriptionEn || '');
  return language.value === 'zh-CN' ? translate(original) : original;
});
const displayImage = computed(() => {
  const source = activeLevel.value?.images || entity.value?.images;
  if (source && typeof source === 'object') {
    const path = Object.values(source as DataRecord).find((value) => typeof value === 'string' && value.startsWith('images/'));
    if (typeof path === 'string') return assetUrl(path);
  }
  return selectedItem.value?.icon ? assetUrl(selectedItem.value.icon) : '';
});

function targetFor(item: CatalogItem): RouteLocationRaw {
  if (isSearch.value) return { name: 'search', query: { q: query.value, item: item.key } };
  return { name: 'detail', params: { base: activeBase.value, category: scopeCategory.value, id: item.id } };
}
function resetRouteSelection() {
  page.value = 1;
  if (isSearch.value) router.replace({ name: 'search', query: { q: query.value } });
  else router.replace({ name: 'list', params: { base: activeBase.value, category: scopeCategory.value } });
}
function clearFilters() {
  typeFilter.value = 'all'; sort.value = 'name'; resetRouteSelection();
}
function changePage(next: number) {
  page.value = Math.min(Math.max(next, 1), pageCount.value);
  const first = filtered.value[(page.value - 1) * PAGE_SIZE];
  if (first) router.replace(targetFor(first));
}
function revealSelectedLevel(behavior: ScrollBehavior = 'smooth') {
  nextTick(() => {
    requestAnimationFrame(() => {
      const strip = levelStrip.value;
      const current = strip?.querySelector<HTMLElement>('[aria-current="true"]');
      if (!strip || !current) return;
      const currentLeft = current.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft;
      const left = Math.max(0, currentLeft - (strip.clientWidth - current.offsetWidth) / 2);
      if (behavior === 'auto') strip.scrollLeft = left;
      else strip.scrollTo({ left, behavior });
    });
  });
}
function selectLevel(index: number) {
  selectedLevel.value = Math.min(Math.max(index, 0), Math.max(levels.value.length - 1, 0));
  revealSelectedLevel();
}
async function loadSelected(item?: CatalogItem) {
  const request = ++entityRequest;
  entity.value = undefined;
  entityError.value = '';
  if (!item) return;
  entityLoading.value = true;
  try {
    const result = await loadEntity(item);
    if (request !== entityRequest) return;
    entity.value = result;
    selectedLevel.value = Math.max(0, (Array.isArray(result.levels) ? result.levels.length : 1) - 1);
    revealSelectedLevel('auto');
  } catch (reason) {
    if (request === entityRequest) entityError.value = reason instanceof Error ? reason.message : text('详情加载失败', 'Failed to load details');
  } finally {
    if (request === entityRequest) entityLoading.value = false;
  }
}

watch([activeBase, scopeCategory, query], () => {
  typeFilter.value = 'all'; sort.value = 'name'; page.value = 1;
});
watch([typeFilter, sort], () => { if (page.value > pageCount.value) page.value = 1; });
watch(selectedItem, loadSelected, { immediate: true });
onMounted(async () => { items.value = await loadCatalog(); loading.value = false; });
</script>

<template>
  <div class="dashboard-view">
    <aside class="world-sidebar" :aria-label="text('数据领域', 'Data domains')">
      <nav class="world-nav">
        <RouterLink v-for="section in sections" :key="section.key" :to="`/${section.key}/all`" class="world-link" :class="{ active: !isSearch && activeBase === section.key }">
          <component :is="section.icon" :size="26" :weight="!isSearch && activeBase === section.key ? 'Filled' : 'Outline'" aria-hidden="true" />
          <span><strong>{{ text(section.zh, section.en) }}</strong><small>{{ counts[section.key] || 0 }} {{ text('项数据', 'entries') }}</small></span>
          <ChevronRight :size="18" aria-hidden="true" />
        </RouterLink>
      </nav>
      <div class="sidebar-motto" aria-hidden="true"><ShieldStar :size="34" /><span>{{ text('更了解数据，让每一次进攻更从容', 'Know the data. Plan every attack.') }}</span></div>
    </aside>

    <section class="catalog-panel">
      <div class="dashboard-filters" :aria-label="text('数据筛选', 'Data filters')">
        <SelectMenu v-model="typeFilter" :label="text('类型筛选', 'Filter by type')" :options="typeOptions" @change="resetRouteSelection" />
        <SelectMenu v-model="sort" class="sort-filter" :label="text('排序方式', 'Sort order')" :options="sortOptions" @change="resetRouteSelection" />
        <button class="clear-filter" type="button" :aria-label="text('清空筛选', 'Clear filters')" @click="clearFilters"><Refresh :size="19" /><span>{{ text('清空', 'Clear') }}</span></button>
      </div>
      <LoadingState v-if="loading" />
      <template v-else-if="pageItems.length">
        <div class="dashboard-grid"><ItemCard v-for="item in pageItems" :key="item.key" :item="item" :to="targetFor(item)" :selected="selectedItem?.key === item.key" /></div>
        <nav class="catalog-pagination" :aria-label="text('结果分页', 'Results pagination')">
          <button type="button" :disabled="page === 1" :aria-label="text('上一页', 'Previous page')" @click="changePage(page - 1)"><ChevronLeft :size="19" /></button>
          <span>{{ page }} / {{ pageCount }}</span>
          <button type="button" :disabled="page === pageCount" :aria-label="text('下一页', 'Next page')" @click="changePage(page + 1)"><ChevronRight :size="19" /></button>
        </nav>
      </template>
      <EmptyState v-else :title="query ? text('没有找到相关数据', 'No matching data') : text('当前筛选没有结果', 'No results for these filters')" />
    </section>

    <aside class="detail-panel" :aria-label="text('数据详情', 'Data details')">
      <LoadingState v-if="entityLoading" />
      <EmptyState v-else-if="entityError || !selectedItem || !entity" :title="text('无法显示详情', 'Unable to show details')" :description="entityError" />
      <div v-else class="detail-scroll">
        <section class="detail-hero">
          <div class="detail-identity">
            <span class="detail-kicker">{{ categoryName(selectedItem.category) }}</span><h2>{{ displayName }}</h2>
            <p v-if="language === 'zh-CN' && selectedItem.nameZh !== selectedItem.nameEn" class="english-name">{{ selectedItem.nameEn }}</p>
            <div class="detail-tags"><span>{{ categoryName(selectedItem.category) }}</span><span>{{ baseName(selectedItem.base) }}</span></div>
            <p v-if="description" class="detail-description">{{ description }}</p>
            <strong v-if="selectedItem.maxLevel" class="max-level">{{ text('最高等级', 'Max level') }} <b>{{ selectedItem.maxLevel }}</b></strong>
          </div>
          <div class="detail-image"><img v-if="displayImage" :src="displayImage" :alt="displayName" decoding="async" /><ShieldStar v-else :size="66" aria-hidden="true" /></div>
        </section>
        <div v-if="levels.length" class="level-control">
          <button type="button" :disabled="selectedLevel === 0" :aria-label="text('上一个等级', 'Previous level')" @click="selectLevel(selectedLevel - 1)"><ChevronLeft :size="20" /></button>
          <div ref="levelStrip" class="level-strip"><button v-for="(level, index) in levels" :key="index" type="button" :class="{ active: selectedLevel === index }" :aria-current="selectedLevel === index ? 'true' : undefined" @click="selectLevel(index)">{{ level.level ?? index + 1 }}</button></div>
          <button type="button" :disabled="selectedLevel === levels.length - 1" :aria-label="text('下一个等级', 'Next level')" @click="selectLevel(selectedLevel + 1)"><ChevronRight :size="20" /></button>
        </div>
      </div>
    </aside>
  </div>
</template>
