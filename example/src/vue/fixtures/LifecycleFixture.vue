<script setup lang="ts">
import { KeepAlive, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { DashboardGrid, useDashboardGrid, type DashboardGridHandle } from "../../../../src/vue";
const active = ref(true), mounted = ref(true), controls = ref(true), custom = ref(false), rtl = ref(false);
const mutationCount = ref(0), events = ref<string[]>([]);
const grid = shallowRef<DashboardGridHandle | null>(null);
const engineCount = ref(0), columnCount = ref<number | null>(null);
const { widgets, columns, commands } = useDashboardGrid<{ value: number }>({
  initialWidgets: [
    { id: "a", title: "Alpha", layout: { id: "a", x: 0, y: 0, w: 4, h: 3 }, data: { value: 1 } },
    { id: "last", title: "Last", layout: { id: "last", x: 0, y: 25, w: 4, h: 3 }, data: { value: 99 } },
  ],
  onLayoutMutation: () => { mutationCount.value += 1; },
});
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    engineCount.value = [...document.querySelectorAll(".grid-stack")].filter(el => Boolean((el as HTMLElement & { gridstack?: unknown }).gridstack)).length;
    columnCount.value = grid.value?.getColumnCount() ?? null;
  }, 30);
});
onBeforeUnmount(() => clearInterval(timer));
</script>
<template>
  <main>
    <nav style="position:sticky;top:0;z-index:10;background:white">
      <button @click="active = !active">Toggle active</button>
      <button @click="mounted = !mounted">Toggle mounted</button>
      <button @click="controls = !controls">Toggle controls</button>
      <button @click="custom = !custom">Custom actions</button>
      <button @click="rtl = !rtl">Toggle RTL</button>
      <button @click="commands.updateWidget('a', { data: { value: 200 } })">Update data</button>
      <button @click="commands.setColumns(6)">Use six columns</button>
      <output data-test="engine-count">{{ engineCount }}</output>
      <output data-test="column-count">{{ columnCount }}</output>
      <output data-test="mutation-count">{{ mutationCount }}</output>
      <output data-test="events">{{ events.join(',') }}</output>
    </nav>
    <div data-dashboard-lazy-scroll style="height:450px;overflow:auto">
      <KeepAlive v-if="mounted">
        <DashboardGrid v-if="active" ref="grid" :widgets="widgets" :columns="columns" :show-controls="controls"
          :engine-options="{ rtl, cellHeight: 60, float: true }" lazy-render-widget
          class="vue-fixture" aria-label="Vue test grid" @remove-widget="events.push('remove:' + $event)">
          <template #default="{ widget }"><p data-test="body">{{ widget.data?.value }}</p></template>
          <template v-if="custom" #actions="{ widget }"><button>Custom {{ widget.id }}</button></template>
        </DashboardGrid>
      </KeepAlive>
    </div>
  </main>
</template>
