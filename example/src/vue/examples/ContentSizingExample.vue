<script setup lang="ts">
import VueToolbar from './VueToolbar.vue';
import VueStage from "./VueStage.vue";
import { ref } from "vue";
import { DashboardGrid, useDashboardGrid } from "../../../../src/vue";
import { createExampleConditions } from '../../shared/example-conditions';
const props = defineProps<{ exampleId: string; locale: "ko" | "en" }>();
const text = (ko: string, en: string) => props.locale === "ko" ? ko : en;
const enabled = ref(true), lines = ref(2);
const initial = createExampleConditions(props.exampleId);
const { widgets, columns, commands, refreshVersion } = useDashboardGrid({ initialColumns: initial.columns, initialWidgets: initial.widgets });
function change(delta: number) { lines.value = Math.max(1, Math.min(12, lines.value + delta)); }
</script>
<template>
  <VueStage kind="controls" :locale="locale">
<VueToolbar :locale="locale">
    <button type="button" :aria-pressed="enabled" @click="enabled = !enabled">Size To Content {{ enabled ? text('켜짐', 'on') : text('꺼짐', 'off') }}</button>
    <button :disabled="lines >= 12" @click="change(1)">{{ text('내용 추가', 'Add content') }}</button><button :disabled="lines <= 1" @click="change(-1)">{{ text('내용 삭제', 'Remove content') }}</button>
    <button @click="lines = 2">{{ text('내용 초기화', 'Reset content') }}</button>
    <output role="status">{{ text(`항목 ${lines}개 · 현재 h=${widgets[0]?.layout.h}행`, `${lines} items · Current h=${widgets[0]?.layout.h} rows`) }}</output>
  </VueToolbar>
</VueStage>
  <VueStage kind="grid" :locale="locale">
<section class="playground-grid-region" aria-label="Size To Content Grid"><DashboardGrid :widgets="widgets" :columns="columns" :refresh-key="lines" :show-controls="false" :engine-options="{ cellHeight: initial.cellHeight, sizeToContent: enabled, animate: false, alwaysShowResizeHandle: true }"
    @layout-commit="commands.applyLayoutSnapshot" @remove-widget="commands.removeWidget" @maximize-widget="commands.maximizeWidget" @minimize-widget="commands.minimizeWidget" @restore-widget="commands.restoreWidget">
    <template #default><ul class="content-sizing-list"><li v-for="line in lines" :key="line">{{ text(`활동 내역 ${line} — 콘텐츠 높이를 비교합니다.`, `Activity ${line} — compare content height.`) }}</li></ul></template>
  </DashboardGrid></section>
</VueStage>
</template>
