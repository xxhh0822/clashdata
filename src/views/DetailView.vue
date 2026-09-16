<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ChevronLeft, ChevronRight, CircleInfo, Database } from '../icons';
import { assetUrl, loadCatalog, loadEntity } from '../data';
import type { CatalogItem, DataRecord } from '../types';
import { useLanguage } from '../composables/useLanguage';
import DataFields from '../components/DataFields.vue';
import LoadingState from '../components/LoadingState.vue';
import EmptyState from '../components/EmptyState.vue';

const route = useRoute();
const router = useRouter();
const item = ref<CatalogItem>();
const entity = ref<DataRecord>();
const loading = ref(true);
const error = ref('');
const selectedLevel = ref(0);
const { language, translate, baseName, categoryName, text } = useLanguage();

const levels = computed(() => Array.isArray(entity.value?.levels) ? entity.value.levels as DataRecord[] : []);
const activeLevel = computed(() => levels.value[selectedLevel.value]);
const displayName = computed(() => item.value ? (language.value === 'zh-CN' ? item.value.nameZh : item.value.nameEn) : '');
const description = computed(() => {
  const original = String(entity.value?.description || '');
  return language.value === 'zh-CN' ? translate(original) : original;
});
const displayImage = computed(() => {
  const source = activeLevel.value?.images || entity.value?.images;
  if (source && typeof source === 'object') {
    const values = Object.values(source as DataRecord).filter((value) => typeof value === 'string' && value.startsWith('images/')) as string[];
    if (values[0]) return assetUrl(values[0]);
  }
  return item.value?.icon ? assetUrl(item.value.icon) : '';
});

function selectRelative(direction: number) {
  selectedLevel.value = Math.min(Math.max(selectedLevel.value + direction, 0), levels.value.length - 1);
}

async function load() {
  loading.value = true; error.value = '';
  try {
    const catalog = await loadCatalog();
    item.value = catalog.find((entry) => entry.base === route.params.base && entry.category === route.params.category && entry.id === route.params.id);
    if (!item.value) throw new Error(text('没有找到该数据条目。', 'Data entry not found.'));
    entity.value = await loadEntity(item.value);
    selectedLevel.value = Math.max(0, levels.value.length - 1);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : text('数据加载失败。', 'Failed to load data.');
  } finally { loading.value = false; }
}

onMounted(load);
watch(() => route.fullPath, load);
</script>

<template>
  <LoadingState v-if="loading" />
  <EmptyState v-else-if="error || !item || !entity" :title="text('无法显示该数据', 'Unable to display data')" :description="error" />
  <article v-else class="detail-view">
    <button class="back-button" type="button" @click="router.back()"><ArrowLeft :size="19" />{{ text('返回列表', 'Back to list') }}</button>
    <div class="detail-layout">
      <section class="detail-visual">
        <div class="detail-art"><img v-if="displayImage" :src="displayImage" :alt="displayName" decoding="async" /><Database v-else :size="72" aria-hidden="true" /></div>
        <div v-if="levels.length" class="level-picker">
          <button type="button" :disabled="selectedLevel === 0" :aria-label="text('上一个等级', 'Previous level')" @click="selectRelative(-1)"><ChevronLeft :size="20" /></button>
          <label><span>{{ text('当前等级', 'Current level') }}</span><select v-model.number="selectedLevel"><option v-for="(level, index) in levels" :key="index" :value="index">{{ text('等级', 'Level') }} {{ level.level ?? index + 1 }}</option></select></label>
          <button type="button" :disabled="selectedLevel === levels.length - 1" :aria-label="text('下一个等级', 'Next level')" @click="selectRelative(1)"><ChevronRight :size="20" /></button>
        </div>
      </section>

      <section class="detail-content">
        <div class="detail-breadcrumb">{{ baseName(item.base) }} <span>/</span> {{ categoryName(item.category) }}</div>
        <h1>{{ displayName }}</h1>
        <p v-if="language === 'zh-CN' && item.nameZh !== item.nameEn" class="english-name">{{ item.nameEn }}</p>
        <div class="detail-tags"><span>{{ categoryName(item.category) }}</span><span v-if="item.maxLevel">{{ text('最高等级', 'Max level') }} {{ item.maxLevel }}</span><span>ID: {{ item.id }}</span></div>
        <p v-if="description" class="detail-description">{{ description }}</p>

        <section class="stats-panel">
          <header><CircleInfo :size="20" aria-hidden="true" /><h2>{{ activeLevel ? `${text('等级', 'Level')} ${activeLevel.level ?? selectedLevel + 1} ${text('数据', 'data')}` : text('基础数据', 'Base data') }}</h2></header>
          <DataFields v-if="activeLevel" :value="activeLevel" />
          <DataFields v-else :value="entity" />
        </section>

        <details class="all-data-panel">
          <summary>{{ text('查看基础属性', 'View base attributes') }}</summary>
          <DataFields :value="entity" />
        </details>
      </section>
    </div>
  </article>
</template>
