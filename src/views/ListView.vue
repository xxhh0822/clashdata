<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Filter, Grid, Refresh } from '../icons';
import { loadCatalog } from '../data';
import type { CatalogItem } from '../types';
import { useLanguage } from '../composables/useLanguage';
import ItemCard from '../components/ItemCard.vue';
import LoadingState from '../components/LoadingState.vue';
import EmptyState from '../components/EmptyState.vue';

const route = useRoute();
const items = ref<CatalogItem[]>([]);
const loading = ref(true);
const typeFilter = ref('all');
const levelFilter = ref('all');
const sort = ref('name');
const { baseName, categoryName, language, text } = useLanguage();

const base = computed(() => String(route.params.base));
const routeCategory = computed(() => String(route.params.category));
const baseItems = computed(() => items.value.filter((item) => item.base === base.value && (routeCategory.value === 'all' || item.category === routeCategory.value)));
const categories = computed(() => [...new Set(items.value.filter((item) => item.base === base.value).map((item) => item.category))].sort());
const levels = computed(() => [...new Set(baseItems.value.flatMap((item) => item.requiredLevels))].sort((a, b) => a - b));
const filtered = computed(() => {
  const output = baseItems.value.filter((item) =>
    (typeFilter.value === 'all' || item.category === typeFilter.value) &&
    (levelFilter.value === 'all' || item.requiredLevels.includes(Number(levelFilter.value)))
  );
  return [...output].sort((a, b) => sort.value === 'level'
    ? (b.maxLevel || 0) - (a.maxLevel || 0)
    : (language.value === 'zh-CN' ? a.nameZh.localeCompare(b.nameZh, 'zh-CN') : a.nameEn.localeCompare(b.nameEn)));
});

function clearFilters() {
  typeFilter.value = 'all'; levelFilter.value = 'all'; sort.value = 'name';
}

onMounted(async () => { items.value = await loadCatalog(); loading.value = false; });
</script>

<template>
  <div>
    <section class="page-heading">
      <span class="eyebrow">DATA COLLECTION</span>
      <h1>{{ baseName(base) }}</h1>
      <p>{{ text(`共收录 ${baseItems.length} 个数据条目，可按类型和解锁等级筛选。`, `${baseItems.length} entries. Filter by type and unlock level.`) }}</p>
    </section>
    <LoadingState v-if="loading" />
    <template v-else>
      <section class="filter-bar" aria-label="数据筛选">
        <span class="filter-label"><Filter :size="19" aria-hidden="true" />{{ text('筛选', 'Filters') }}</span>
        <label><span>{{ text('类型', 'Type') }}</span><select v-model="typeFilter"><option value="all">{{ text('全部类型', 'All types') }}</option><option v-for="category in categories" :key="category" :value="category">{{ categoryName(category) }}</option></select></label>
        <label><span>{{ text('大本营等级', 'Town Hall level') }}</span><select v-model="levelFilter"><option value="all">{{ text('全部等级', 'All levels') }}</option><option v-for="level in levels" :key="level" :value="String(level)">{{ text('等级', 'Level') }} {{ level }}</option></select></label>
        <label><span>{{ text('排序', 'Sort') }}</span><select v-model="sort"><option value="name">{{ text('名称', 'Name') }}</option><option value="level">{{ text('最高等级', 'Max level') }}</option></select></label>
        <button class="ghost-button" type="button" @click="clearFilters"><Refresh :size="18" />{{ text('重置', 'Reset') }}</button>
      </section>
      <div class="results-meta"><span><Grid :size="18" aria-hidden="true" />{{ filtered.length }} {{ text('个结果', 'results') }}</span></div>
      <div v-if="filtered.length" class="item-grid"><ItemCard v-for="item in filtered" :key="item.key" :item="item" /></div>
      <EmptyState v-else />
    </template>
  </div>
</template>
