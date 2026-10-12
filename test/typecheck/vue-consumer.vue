<script setup lang="ts">
import { DashboardGrid, useDashboardGrid } from "../../src/vue";
import type { DashboardGridEmits } from "../../src/vue";
const { widgets, commands } = useDashboardGrid<{ value: number }>();
const readNumber = (value: number | undefined) => value;
const valid: DashboardGridEmits<{ value: number }>["widgetLayoutChange"] = ["a", { id: "a", x: 0, y: 0, w: 1, h: 1 }];
// @ts-expect-error columnsChange requires a supported column count
const invalid: DashboardGridEmits["columnsChange"] = [99];
void valid; void invalid;
</script>
<template>
  <DashboardGrid :widgets="widgets" @remove-widget="commands.removeWidget">
    <template #default="{ widget }">{{ readNumber(widget.data?.value) }}</template>
    <template #actions="{ widget }"><button>{{ readNumber(widget.data?.value) }}</button></template>
  </DashboardGrid>
</template>
