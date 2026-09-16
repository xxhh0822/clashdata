<script setup lang="ts">
import { Search3 } from '../icons';
import { useLanguage } from '../composables/useLanguage';
defineProps<{ title?: string; description?: string }>();
const { text } = useLanguage();
</script>

<template>
  <div class="state-panel empty-state">
    <Search3 :size="36" aria-hidden="true" />
    <h2>{{ title || text('没有找到相关数据', 'No matching data') }}</h2>
    <p>{{ description || text('请尝试调整搜索词或筛选条件。', 'Try changing the search term or filters.') }}</p>
  </div>
</template>
