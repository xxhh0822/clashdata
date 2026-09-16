<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { Check, ChevronDown } from '../icons';

export interface SelectOption {
  value: string;
  label: string;
}

const props = defineProps<{
  label: string;
  options: SelectOption[];
}>();
const model = defineModel<string>({ required: true });
const emit = defineEmits<{ change: [] }>();

const root = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
const optionButtons = ref<HTMLButtonElement[]>([]);
const open = ref(false);
const activeIndex = ref(0);
const listboxId = `select-${useId()}`;
const selectedOption = computed(() => props.options.find((option) => option.value === model.value) ?? props.options[0]);

function setOptionRef(element: Element | null, index: number) {
  if (element instanceof HTMLButtonElement) optionButtons.value[index] = element;
}

function showMenu(direction = 0) {
  const selectedIndex = Math.max(0, props.options.findIndex((option) => option.value === model.value));
  activeIndex.value = direction < 0 ? props.options.length - 1 : selectedIndex;
  open.value = true;
  nextTick(() => optionButtons.value[activeIndex.value]?.focus());
}

function closeMenu(restoreFocus = false) {
  open.value = false;
  if (restoreFocus) nextTick(() => trigger.value?.focus());
}

function toggleMenu() {
  if (open.value) closeMenu();
  else showMenu();
}

function selectOption(option: SelectOption) {
  if (model.value !== option.value) {
    model.value = option.value;
    emit('change');
  }
  closeMenu(true);
}

function focusOption(index: number) {
  const count = props.options.length;
  if (!count) return;
  activeIndex.value = (index + count) % count;
  optionButtons.value[activeIndex.value]?.focus();
}

function handleOptionKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'ArrowDown') { event.preventDefault(); focusOption(index + 1); }
  else if (event.key === 'ArrowUp') { event.preventDefault(); focusOption(index - 1); }
  else if (event.key === 'Home') { event.preventDefault(); focusOption(0); }
  else if (event.key === 'End') { event.preventDefault(); focusOption(props.options.length - 1); }
  else if (event.key === 'Escape') { event.preventDefault(); closeMenu(true); }
  else if (event.key === 'Tab') closeMenu();
}

function handleDocumentPointer(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) closeMenu();
}

watch(() => props.options, () => {
  optionButtons.value = [];
  if (!props.options.some((option) => option.value === model.value)) closeMenu();
});
onMounted(() => document.addEventListener('pointerdown', handleDocumentPointer));
onBeforeUnmount(() => document.removeEventListener('pointerdown', handleDocumentPointer));
</script>

<template>
  <div ref="root" class="select-menu">
    <button
      ref="trigger"
      class="select-trigger"
      type="button"
      :aria-label="label"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listboxId"
      @click="toggleMenu"
      @keydown.down.prevent="showMenu(1)"
      @keydown.up.prevent="showMenu(-1)"
      @keydown.esc.prevent="closeMenu()"
    >
      <span>{{ selectedOption?.label }}</span>
      <ChevronDown :size="17" aria-hidden="true" />
    </button>
    <div v-if="open" :id="listboxId" class="select-options" role="listbox" :aria-label="label">
      <button
        v-for="(option, index) in options"
        :key="option.value"
        :ref="(element) => setOptionRef(element as Element | null, index)"
        class="select-option"
        :class="{ selected: option.value === model }"
        type="button"
        role="option"
        :aria-selected="option.value === model"
        @click="selectOption(option)"
        @focus="activeIndex = index"
        @keydown="handleOptionKeydown($event, index)"
      >
        <span>{{ option.label }}</span>
        <Check v-if="option.value === model" :size="17" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
