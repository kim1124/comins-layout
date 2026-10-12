<script setup lang="ts">
import { reactive, ref } from "vue";
import { DashboardGrid, useDashboardDragIn, type DashboardGridEngineOptions, type DashboardWidget } from "../../../../src/vue";
const widgets = ref<DashboardWidget[]>([{ id: "a", layout: { id: "a", x: 0, y: 0, w: 2, h: 2 } }]);
const engineOptions = reactive<DashboardGridEngineOptions>({ cellHeight: 60, float: false, staticGrid: false });
const dragOptions = reactive({ sourceId: "reactive-palette", previewLayout: { w: 2, h: 2 }, dragOptions: { scroll: true },
  createWidget: (): DashboardWidget => ({ id: "palette", layout: { id: "palette", x: 0, y: 0, w: 2, h: 2 } }),
});
const palette = useDashboardDragIn(dragOptions);
</script>
<template>
  <button @click="widgets.push({ id: 'b', layout: { id: 'b', x: 4, y: 0, w: 2, h: 2 } })">Push widget</button>
  <button @click="widgets.splice(1, 1)">Splice widget</button>
  <button @click="widgets[0]!.layout.w = 3">Change layout</button>
  <button @click="engineOptions.float = true; engineOptions.cellHeight = 90; engineOptions.staticGrid = true">Change engine options</button>
  <button @click="dragOptions.previewLayout.w = 4; dragOptions.dragOptions.scroll = false">Change preview</button>
  <div ref="palette" data-test="reactive-palette" style="width:100px;height:50px;background:lightblue">Palette</div>
  <DashboardGrid :widgets="widgets" :engine-options="engineOptions" grid-id="reactive-target" accept-external-widgets
    @widget-drop-request="widgets.push({ ...$event.widget, layout: $event.targetLayout })" />
</template>
