<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Search3 } from '../icons';
import { loadCatalog } from '../data';
import type { CatalogItem } from '../types';
import ItemCard from '../components/ItemCard.vue';
import LoadingState from '../components/LoadingState.vue';
import EmptyState from '../components/EmptyState.vue';
import { useLanguage } from '../composables/useLanguage';

const route = useRoute();
const items = ref<CatalogItem[]>([]);
const loading = ref(true);
const { text } = useLanguage();
const query = computed(() => String(route.query.q || '').trim());
const results = computed(() => {
  const needle = query.value.toLocaleLowerCase();
  if (!needle) return [];
  return items.value.filter((item) => [item.nameZh, item.nameEn, item.id, String(item.dataId || '')].some((value) => value.toLocaleLowerCase().includes(needle)));
});

onMounted(async () => { items.value = await loadCatalog(); loading.value = false; });
watch(query, () => window.scrollTo({ top: 0 }));
</script>

<template>
  <div>
    <section class="page-heading search-heading"><Search3 :size="30" aria-hidden="true" /><div><span class="eyebrow">SEARCH RESULTS</span><h1>{{ text(`“${query}”的搜索结果`, `Results for “${query}”`) }}</h1><p>{{ text('同时匹配中文、英文、字符串 ID 和数据 ID。', 'Matches Chinese, English, string IDs and data IDs.') }}</p></div></section>
    <LoadingState v-if="loading" />
    <div v-else-if="results.length" class="item-grid"><ItemCard v-for="item in results" :key="item.key" :item="item" /></div>
    <EmptyState v-else :title="query ? text('没有找到相关数据', 'No matching data') : text('请输入搜索内容', 'Enter a search term')" />
  </div>
</template>
