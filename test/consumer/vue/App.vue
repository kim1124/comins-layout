<script setup lang="ts">
import { DashboardGrid, useDashboardGrid } from "comins-grid-layout/vue";
const { widgets, columns, commands } = useDashboardGrid<{ value: number }>({ initialWidgets: [{ id: "one", title: "One", layout: { id: "one", x: 0, y: 0, w: 6, h: 3 }, data: { value: 42 } }] });
</script>
<template>
  <DashboardGrid :widgets="widgets" :columns="columns" @layout-commit="commands.applyLayoutSnapshot" @columns-change="commands.setColumns"
    @maximize-widget="commands.maximizeWidget" @minimize-widget="commands.minimizeWidget" @restore-widget="commands.restoreWidget" @remove-widget="commands.removeWidget">
    <template #default="{ widget }"><p data-value>{{ widget.data?.value.toFixed(0) }}</p></template>
  </DashboardGrid>
</template>
