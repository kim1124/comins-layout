<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import {
  DashboardGrid, useDashboardGrid, useDashboardDragIn, transferDashboardWidget, insertDashboardWidgetAtLayout, serializeDashboardState,
  type DashboardGridHandle, type DashboardWidget, type DashboardWidgetDropRequest, type DashboardResponsiveOptions, type DashboardStateSnapshot,
} from "../../../../src/vue";
type Data = { value: number | string };
const widget = (id: string, title: string, x = 0): DashboardWidget<Data> => ({ id, title, layout: { id, x, y: 0, w: 3, h: 3 }, data: { value: 1 } });
const events = ref<string[]>([]);
const log = (event: string) => { events.value = [...events.value.slice(-99), event]; };
const dashboard = useDashboardGrid<Data>({ initialWidgets: [widget("a", "Alpha"), widget("b", "Beta", 4)] });
const { widgets, columns, commands, refreshVersion } = dashboard;
const target = useDashboardGrid<Data>();
const child = useDashboardGrid<Data>({ initialColumns: 6, initialWidgets: [widget("child", "Child")] });
const grid = shallowRef<DashboardGridHandle | null>(null);
const staticGrid = ref(false), editable = ref(true), movable = ref(true), resizable = ref(true);
const sizing = ref(false), nested = ref(false), transfer = ref(false), lines = ref(2), width = ref(1000);
const responsiveMode = ref("off"), transferMode = ref<"copy" | "move">("copy");
const saved = ref(""), operation = ref("");
let sequence = 0, paletteSequence = 0;
const responsive = computed<DashboardResponsiveOptions | undefined>(() => responsiveMode.value === "off" ? undefined
  : responsiveMode.value === "columnWidth" ? { columnWidth: 150, columnMax: 12 }
  : { breakpoints: [{ maxWidth: 600, columns: 4 }, { maxWidth: 900, columns: 8 }], layout: responsiveMode.value === "none" ? "none" : "moveScale" });
const options = computed(() => ({ cellHeight: 60, margin: 4, animate: false, staticGrid: staticGrid.value, sizeToContent: sizing.value, alwaysShowResizeHandle: true as const }));
const palette = useDashboardDragIn<Data>({ sourceId: "palette", previewLayout: { w: 2, h: 2 }, createWidget: () => widget("palette-" + ++paletteSequence, "Palette widget") });
function applyDrop(request: DashboardWidgetDropRequest<Data>) {
  const destination = request.targetGridId === "target" ? target : dashboard;
  if (request.source.kind === "palette") {
    const result = insertDashboardWidgetAtLayout(destination.state.value, request.widget, request.targetLayout, request.targetSnapshot);
    if (result.accepted) destination.commands.restoreLayout(serializeDashboardState(result.state));
    operation.value = result.accepted ? "accepted" : result.reason;
  } else {
    const source = request.source.gridId === "target" ? target : dashboard;
    const result = transferDashboardWidget({ source: source.state.value, target: destination.state.value, widgetId: request.source.widgetId, mode: request.mode, targetLayout: request.targetLayout, targetSnapshot: request.targetSnapshot });
    if (result.accepted) { source.commands.restoreLayout(serializeDashboardState(result.source)); destination.commands.restoreLayout(serializeDashboardState(result.target)); }
    operation.value = result.accepted ? "accepted" : result.reason;
  }
}
function restore() { commands.restoreLayout(JSON.parse(saved.value) as DashboardStateSnapshot<Data>); }
</script>
<template>
  <main style="font:14px sans-serif">
    <nav style="display:flex;flex-wrap:wrap;gap:4px">
      <button @click="commands.addWidget(widget('new-' + ++sequence, 'New'))">Add widget</button>
      <button @click="commands.resizeWidget('a', { w: 4, h: 3 })">API size 4×3</button>
      <button @click="commands.resizeWidget('a', { w: 3, h: 1 })">API size 3×1</button>
      <button @click="commands.updateWidget('a', { data: { value: 200 } })">Update data</button>
      <button @click="commands.clearWidgets">Clear</button><button @click="commands.resetLayout()">Reset</button>
      <button @click="commands.autoArrangeWidgets">Arrange</button><button @click="commands.fitWidgetsToColumns">Fill</button>
      <button @click="saved = JSON.stringify(commands.serializeState())">Save state</button><button @click="restore">전체 상태 복원</button>
      <label>컬럼 선택<select aria-label="컬럼 선택" :value="columns" @change="commands.setColumns(Number(($event.target as HTMLSelectElement).value))"><option v-for="n in 12" :key="n">{{ n }}</option></select></label>
      <button @click="staticGrid = !staticGrid">Static</button><button @click="editable = !editable">Editable</button>
      <button @click="movable = !movable">Movable</button><button @click="resizable = !resizable">Resizable</button>
      <button @click="commands.updateWidget('a', { locked: !widgets.find(item => item.id === 'a')?.locked })">Widget lock</button>
      <label>Responsive mode<select v-model="responsiveMode" aria-label="Responsive mode"><option>off</option><option>columnWidth</option><option>breakpoints</option><option>none</option></select></label>
      <button @click="width = 500">Narrow</button><button @click="width = 1000">Wide</button>
      <button @click="sizing = !sizing">Content sizing</button><button @click="lines += 12; commands.refreshLayout()">Grow content</button><button @click="lines = 2; commands.refreshLayout()">Shrink content</button>
      <button @click="nested = !nested">Nested</button><button @click="transfer = !transfer">Transfer</button>
      <button @click="grid?.compact('compact', true)">Compact</button>
    </nav>
    <label>전체 상태 및 컬럼 캐시 JSON<textarea v-model="saved" aria-label="전체 상태 및 컬럼 캐시 JSON" /></label>
    <p>위젯 {{ widgets.length }}개</p>
    <output data-test="events">{{ events.join(',') }}</output>
    <div v-if="transfer">
      <button ref="palette">Palette</button><button @click="target.commands.clearWidgets">Clear target</button>
      <label>Transfer mode<select v-model="transferMode" aria-label="Transfer mode"><option>copy</option><option>move</option></select></label>
      <div id="parity-trash" style="height:80px;background:#fee">Trash</div>
      <output data-test="operation">{{ operation }}</output>
      <output data-test="snapshots">{{ JSON.stringify([commands.serializeState(), target.commands.serializeState()]) }}</output>
    </div>
    <div style="display:flex;gap:20px;align-items:flex-start">
      <div :style="{ width: transfer ? '48%' : width + 'px', maxWidth: '100%', flexShrink: 0 }">
        <DashboardGrid ref="grid" :widgets="widgets" :columns="columns" :refresh-key="refreshVersion" :engine-options="options" :responsive="responsive"
          :editable="editable" :movable="movable" :resizable="resizable" grid-id="source" :grid-transfer-mode="transferMode"
          :external-drop-targets="transfer ? [{ id: 'trash', selector: '#parity-trash' }] : undefined"
          @widget-external-drop="commands.removeWidget($event.widgetId)" @widget-drop-request="applyDrop"
          @columns-change="commands.setColumns" @layout-commit="snapshot => { commands.applyLayoutSnapshot(snapshot); log('layoutCommit'); }" @restore-widget="commands.restoreWidget" @remove-widget="commands.removeWidget"
          @before-move="log('beforeMove')" @move="log('move')" @after-move="log('afterMove')"
          @before-resize="log('beforeResize')" @resize="log('resize')" @after-resize="log('afterResize')">
          <template #default="{ widget: item }">
            <div style="width:100%;min-width:0">
            <p data-test="value">{{ item.data?.value }}</p>
            <p v-for="line in sizing ? lines : 0" :key="line">Content line {{ line }}</p>
            <DashboardGrid v-if="nested && item.id === 'a'" :widgets="child.widgets.value" :columns="child.columns.value" :engine-options="{ cellHeight: 30 }"
              @layout-commit="child.commands.applyLayoutSnapshot" @remove-widget="child.commands.removeWidget">
              <template #default="{ widget: inner }">{{ inner.data?.value }}</template>
            </DashboardGrid>
            </div>
          </template>
        </DashboardGrid>
      </div>
      <div v-if="transfer" style="width:48%">
        <DashboardGrid :widgets="target.widgets.value" :columns="target.columns.value" grid-id="target" accept-external-widgets
          :engine-options="{ cellHeight: 60, minRow: 5 }" :external-drop-targets="[{ id: 'trash', selector: '#parity-trash' }]"
          @widget-drop-request="applyDrop" @layout-commit="target.commands.applyLayoutSnapshot" @widget-external-drop="target.commands.removeWidget($event.widgetId)">
          <template #default="{ widget: item }"><p data-test="value">{{ item.data?.value }}</p></template>
        </DashboardGrid>
      </div>
    </div>
  </main>
</template>
