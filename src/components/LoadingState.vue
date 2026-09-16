<script setup lang="ts">
import { Database } from '../icons';
import { useLanguage } from '../composables/useLanguage';
defineProps<{ text?: string }>();
const { text: localize } = useLanguage();
</script>

<template>
  <div class="state-panel" role="status">
    <Database :size="32" aria-hidden="true" />
    <p>{{ text || localize('正在加载数据…', 'Loading data…') }}</p>
  </div>
</template>
