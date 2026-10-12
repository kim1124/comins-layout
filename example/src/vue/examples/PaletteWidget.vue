<script setup lang="ts">
import { useDashboardDragIn, type DashboardWidget } from '../../../../src/vue';
import type { ExampleWidgetData } from '../../playground/types';
import VueIcon from './VueIcon.vue';
const props = defineProps<{ sourceId: string; label: string; description: string; createWidget: () => DashboardWidget<ExampleWidgetData>; width: number; locale: 'ko' | 'en'; restricted?: boolean }>();
defineEmits<{ add: [widget: DashboardWidget<ExampleWidgetData>, target: string] }>();
const element = useDashboardDragIn(() => ({ sourceId: props.sourceId, previewLayout: { w: props.width, h: 2 }, createWidget: () => props.createWidget(), dragOptions: { handle: '.transfer-palette-item__handle' } }));
</script>
<template>
  <article ref="element" class="transfer-palette-item" :data-palette-id="sourceId" :data-restricted="String(restricted ?? false)">
    <div class="transfer-palette-item__handle" :data-testid="`palette-drag-${sourceId}`"><span>{{ restricted ? (locale === 'ko' ? '거부 예제' : 'Rejected example') : (locale === 'ko' ? '허용' : 'Allowed') }}</span><strong>{{ label }}</strong><small>{{ description }}</small></div>
    <div class="transfer-palette-item__actions"><button type="button" @click="$emit('add', createWidget(), 'grid-a')"><VueIcon name="Plus" :size="13" />{{ locale === 'ko' ? 'Grid A에 추가' : 'Add to Grid A' }}</button><button type="button" @click="$emit('add', createWidget(), 'grid-b')"><VueIcon name="Plus" :size="13" />{{ locale === 'ko' ? 'Grid B에 추가' : 'Add to Grid B' }}</button></div>
  </article>
</template>
