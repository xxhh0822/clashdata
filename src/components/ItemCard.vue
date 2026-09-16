<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { Star } from '../icons';
import type { CatalogItem } from '../types';
import { assetUrl } from '../data';
import { useLanguage } from '../composables/useLanguage';

const props = withDefaults(defineProps<{ item: CatalogItem; selected?: boolean; to?: RouteLocationRaw }>(), {
  selected: false,
  to: undefined,
});
const { language, categoryName } = useLanguage();
const name = computed(() => language.value === 'zh-CN' ? props.item.nameZh : props.item.nameEn);
const image = computed(() => assetUrl(props.item.thumbnail || props.item.icon));
</script>

<template>
  <RouterLink class="item-card" :class="{ selected }" :to="to || `/${item.base}/${item.category}/${item.id}`" :aria-current="selected ? 'true' : undefined">
    <div class="item-art">
      <img v-if="image" :src="image" :alt="name" loading="lazy" decoding="async" />
      <div v-else class="image-fallback" aria-hidden="true">{{ name.slice(0, 1) }}</div>
      <span v-if="item.maxLevel" class="level-badge">Lv. {{ item.maxLevel }}</span>
      <span class="card-favorite" aria-hidden="true"><Star :size="18" /></span>
    </div>
    <div class="item-copy">
      <h3>{{ name }}</h3>
      <p v-if="language === 'zh-CN' && item.nameZh !== item.nameEn">{{ item.nameEn }}</p>
      <span class="item-category">{{ categoryName(item.category) }}</span>
    </div>
  </RouterLink>
</template>
