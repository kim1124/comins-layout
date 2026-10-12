<script setup lang="ts">
import { DashboardGrid, useDashboardGrid } from '../../../../src/vue';
import { createNestedConditions } from '../../shared/example-conditions';
import NumberedContent from './NumberedContent.vue';
const props = defineProps<{ remaining: number; level: number; locale: 'ko' | 'en' }>();
const initial = createNestedConditions(props.level, props.remaining);
const { widgets, columns, commands, refreshVersion } = useDashboardGrid({ initialColumns: initial.columns, initialWidgets: initial.widgets });
</script>
<template>
  <div class="nested-example-level" :data-nested-level="level">
    <DashboardGrid class="playground-grid--title-handle" :refresh-key="refreshVersion" accept-external-widgets :widgets="widgets" :columns="columns" :show-controls="false" :grid-id="`nested-grid-${level}`"
      :engine-options="{ animate: false, cellHeight: 84, dragHandle: '.comins-grid-layout-widget__title' }"
      @layout-commit="commands.applyLayoutSnapshot">
      <template #default="{ widget }"><NestedGrid v-if="remaining > 1 && widget.id === `widget-${level * 10 + 1}`" :remaining="remaining - 1" :level="level + 1" :locale="locale" />
        <NumberedContent v-else :widget="widget" :locale="locale" /></template>
    </DashboardGrid>
  </div>
</template>
