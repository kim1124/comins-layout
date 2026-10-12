<script setup lang="ts">
import type { DashboardWidget } from '../../../../src/core';
import type { ExampleWidgetData } from '../../playground/types';
withDefaults(defineProps<{ widget: DashboardWidget<ExampleWidgetData>; locale: 'ko' | 'en'; movable?: boolean; resizable?: boolean }>(), { movable: true, resizable: true });
</script>
<template>
  <div class="playground-numbered-widget-content">
    <table class="playground-widget-settings" :aria-label="`${widget.title} ${locale === 'ko' ? '위젯 설정' : 'widget settings'}`">
      <caption>{{ widget.data?.description ?? widget.title }}</caption><tbody>
        <tr><th scope="row">N</th><td>{{ widget.data?.number ?? widget.id }}</td></tr>
        <tr><th scope="row">W</th><td>{{ widget.layout.w }}</td></tr><tr><th scope="row">H</th><td>{{ widget.layout.h }}</td></tr>
        <tr><th scope="row">{{ locale === 'ko' ? '이동' : 'Movable' }}</th><td>{{ movable !== false && !widget.locked && widget.movable !== false ? (locale === 'ko' ? '가능' : 'Yes') : (locale === 'ko' ? '불가' : 'No') }}</td></tr>
        <tr><th scope="row">{{ locale === 'ko' ? '리사이즈' : 'Resizable' }}</th><td>{{ resizable !== false && !widget.locked && widget.resizable !== false ? (locale === 'ko' ? '가능' : 'Yes') : (locale === 'ko' ? '불가' : 'No') }}</td></tr>
      </tbody>
    </table>
  </div>
</template>
