<script setup lang="ts">
import { computed } from 'vue';
import { assetUrl } from '../data';
import { useLanguage } from '../composables/useLanguage';

const props = withDefaults(defineProps<{ value: Record<string, unknown>; excluded?: string[] }>(), { excluded: () => [] });
const { translate, fieldName, text } = useLanguage();
const builtInExcluded = new Set(['id', 'dataId', 'name', 'description', 'images', 'image', 'icon', 'levels']);

const rows = computed(() => flatten(props.value).filter(([key]) => !builtInExcluded.has(key) && !props.excluded.includes(key)));

function flatten(value: Record<string, unknown>, prefix = ''): Array<[string, unknown]> {
  const result: Array<[string, unknown]> = [];
  for (const [key, child] of Object.entries(value)) {
    const outputKey = prefix ? `${prefix}.${key}` : key;
    if (child == null || key === 'images' || key === 'image' || key === 'icon') continue;
    if (Array.isArray(child)) {
      if (child.every((item) => typeof item !== 'object')) result.push([outputKey, child.join(', ')]);
    } else if (typeof child === 'object') result.push(...flatten(child as Record<string, unknown>, outputKey));
    else result.push([outputKey, child]);
  }
  return result;
}

function format(key: string, value: unknown) {
  if (typeof value === 'boolean') return value ? text('是', 'Yes') : text('否', 'No');
  if (typeof value === 'number') return new Intl.NumberFormat().format(value);
  if (typeof value === 'string' && value.startsWith('images/')) return assetUrl(value);
  return typeof value === 'string' ? translate(value) : String(value);
}
</script>

<template>
  <dl class="data-fields">
    <template v-for="([key, child]) in rows" :key="key">
      <div class="data-row">
        <dt>{{ fieldName(key.split('.').at(-1) || key) }}</dt>
        <dd>{{ format(key, child) }}</dd>
      </div>
    </template>
  </dl>
</template>
