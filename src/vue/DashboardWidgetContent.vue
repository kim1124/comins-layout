<script setup lang="ts">
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from "vue";
import { observeDashboardContent } from "../browser/lazy-content";
import { isDashboardContentPositioned } from "../gridstack/element-state";
const props = defineProps<{ enabled: boolean }>();
const element = ref<HTMLElement | null>(null);
const visible = ref(!props.enabled);
let active = false;
let dispose: (() => void) | undefined;
function stop() { active = false; dispose?.(); dispose = undefined; }
function observe() {
  dispose?.();
  if (active && element.value && !visible.value) {
    const target = element.value;
    dispose = observeDashboardContent(target, {
      enabled: props.enabled,
      isPositioned: () => isDashboardContentPositioned(target),
      onVisible: () => { visible.value = true; },
    });
  }
}
function start() { if (!active) { active = true; observe(); } }
onMounted(start);
onActivated(start);
onDeactivated(stop);
onBeforeUnmount(stop);
watch(() => props.enabled, observe, { flush: "post" });
</script>

<template>
  <div ref="element" class="comins-grid-layout-widget__render-boundary" :data-lazy-rendered="String(visible)">
    <slot v-if="visible" />
  </div>
</template>
