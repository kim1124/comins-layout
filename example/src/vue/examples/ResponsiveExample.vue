<script setup lang="ts">
import { ref } from 'vue';
import VueStage from './VueStage.vue';
import ResponsiveExperiment from './ResponsiveExperiment.vue';
const props = defineProps<{ exampleId: string; locale: 'ko' | 'en' }>();
const text = (ko: string, en: string) => props.locale === 'ko' ? ko : en;
const mode = ref<'columnWidth' | 'breakpoints'>('columnWidth'), policy = ref<'moveScale' | 'none'>('moveScale'), width = ref(1080), generation = ref(0), enabled = ref(true);
function restart() { generation.value++; }
</script>
<template>
  <VueStage kind="controls" :locale="locale">
<div class="example-actions responsive-demo-controls">
    <label>{{ text('컬럼 결정 방식', 'Column calculation') }}<select v-model="mode" @change="restart"><option value="columnWidth">{{ text('목표 컬럼 너비 (180px)', 'Target column width (180px)') }}</option><option value="breakpoints">{{ text('너비 구간 (Breakpoint)', 'Width ranges (breakpoints)') }}</option></select></label>
    <label>{{ text('배치 정책', 'Layout policy') }}<select v-model="policy" @change="restart"><option value="moveScale">{{ text('위치·너비 비례 조정 (moveScale)', 'Scale position and width (moveScale)') }}</option><option value="none">{{ text('비례 조정 안 함 (none)', 'No proportional scaling (none)') }}</option></select></label>
    <label>{{ text('컨테이너 너비', 'Container width') }}<input v-model.number="width" type="number" min="280" max="1440" step="20" /></label>
    <input :aria-label="text('너비 슬라이더', 'Width slider')" v-model.number="width" type="range" min="280" max="1440" step="20" />
    <button type="button" :aria-pressed="enabled" @click="enabled = !enabled; restart()">{{ text('반응형 설정', 'Responsive settings') }} {{ enabled ? text('적용', 'applied') : text('해제', 'disabled') }}</button>
    <button @click="restart">{{ text('다시 실험', 'Restart experiment') }}</button>
  </div>
</VueStage>
  <ResponsiveExperiment :key="generation" :locale="locale" :mode="mode" :policy="policy" :width="width" :enabled="enabled" />
</template>
