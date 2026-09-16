<script setup lang="ts">
import SiteHeader from './components/SiteHeader.vue';
import { useLanguage } from './composables/useLanguage';
const { text } = useLanguage();
</script>

<template>
  <div class="app-shell">
    <SiteHeader />
    <main class="page-shell"><RouterView /></main>
    <footer class="site-footer">
      <div><strong>Clash Data</strong><span>{{ text('部落冲突数据图鉴', 'Data Encyclopedia') }}</span></div>
      <p>{{ text('非官方粉丝项目，仅供学习与交流；与 Supercell 无关联，未获其认可或赞助。', 'An unofficial fan project for reference only; not affiliated with, endorsed or sponsored by Supercell.') }}</p>
      <nav :aria-label="text('页脚链接', 'Footer links')">
        <a href="https://github.com/chiefpansancolt/clash-of-clans-data" target="_blank" rel="noopener noreferrer">{{ text('数据来源', 'Data source') }}</a>
        <a href="https://supercell.com/en/fan-content-policy/" target="_blank" rel="noopener noreferrer">{{ text('粉丝内容政策', 'Fan Content Policy') }}</a>
      </nav>
    </footer>
  </div>
</template>
