<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Globe, Home, Search3 } from '../icons';
import { useLanguage } from '../composables/useLanguage';

const router = useRouter();
const route = useRoute();
const query = ref(String(route.query.q || ''));
const { language, setLanguage, text } = useLanguage();

function submitSearch() {
  const value = query.value.trim();
  router.push(value ? { name: 'search', query: { q: value } } : { name: 'home' });
}
watch(() => route.query.q, (value) => { query.value = String(value || ''); });
</script>

<template>
  <header class="site-header">
    <RouterLink class="brand" to="/" :aria-label="text('Clash Data 首页', 'Clash Data home')">
      <span class="brand-mark"><Home :size="25" weight="Filled" aria-hidden="true" /></span>
      <span class="brand-copy"><strong>Clash Data</strong><small>{{ text('部落冲突数据图鉴', 'Data Encyclopedia') }}</small></span>
    </RouterLink>

    <form class="global-search" role="search" @submit.prevent="submitSearch">
      <Search3 :size="20" aria-hidden="true" />
      <input v-model="query" type="search" :placeholder="text('搜索名称或 ID', 'Search name or ID')" :aria-label="text('搜索名称或 ID', 'Search name or ID')" />
    </form>

    <div class="header-actions">
      <div class="language-switch" role="group" :aria-label="text('语言切换', 'Language switch')">
        <Globe :size="18" aria-hidden="true" />
        <button class="language-option" :class="{ active: language === 'zh-CN' }" type="button" aria-label="切换为中文" @click="setLanguage('zh-CN')">中文</button>
        <button class="language-option" :class="{ active: language === 'en' }" type="button" aria-label="Switch to English" @click="setLanguage('en')">English</button>
      </div>
      <a class="github-link" href="https://github.com/xxhh0822/clashdata" target="_blank" rel="noopener noreferrer">GitHub</a>
    </div>
  </header>
</template>
