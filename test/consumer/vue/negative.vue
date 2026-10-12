<script setup lang="ts">
import { DashboardGrid, useDashboardGrid } from "comins-grid-layout/vue";
const { widgets } = useDashboardGrid<{ value: number }>();
const wrongEvent = (_id: number) => {};
</script>
<template>
  <DashboardGrid :widgets="widgets" :columns="'wrong'" @remove-widget="wrongEvent">
    <template #default="{ widget }">{{ widget.data?.value.toUpperCase() }}</template>
    <template #actions="{ widget }">{{ widget.data?.missingField }}</template>
  </DashboardGrid>
</template>
