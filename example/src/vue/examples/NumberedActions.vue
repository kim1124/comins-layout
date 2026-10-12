<script setup lang="ts" generic="TData">
import type { DashboardWidget, DashboardGridCommands } from '../../../../src/core';
import VueIcon from './VueIcon.vue';
import { widgetControlIcons } from '../../shared/widget-control-icons';
defineProps<{ widget: DashboardWidget<TData>; commands: DashboardGridCommands<TData>; locale: 'ko' | 'en' }>();
</script>
<template>
  <button type="button" :title="locale === 'ko' ? (widget.locked || widget.resizable === false ? '리사이즈 잠금 해제' : '리사이즈 잠금') : (widget.locked || widget.resizable === false ? 'Unlock resizing' : 'Lock resizing')" data-widget-action="resize-lock" :aria-label="`${widget.title} ${locale === 'ko' ? '리사이즈 ' + ((widget.locked === true || widget.resizable === false) ? '잠금 해제' : '잠금') : ((widget.locked === true || widget.resizable === false) ? 'Unlock resizing' : 'Lock resizing')}`"
    :aria-pressed="(widget.locked === true || widget.resizable === false)" @click="commands.updateWidget(widget.id, { resizable: (widget.locked === true || widget.resizable === false) })"><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path v-for="d in widgetControlIcons.resize" :key="d" :d="d" /></svg></button>
  <button type="button" :title="locale === 'ko' ? (widget.locked || widget.movable === false ? '이동 잠금 해제' : '이동 잠금') : (widget.locked || widget.movable === false ? 'Unlock movement' : 'Lock movement')" data-widget-action="move-lock" :aria-label="`${widget.title} ${locale === 'ko' ? '이동 ' + ((widget.locked === true || widget.movable === false) ? '잠금 해제' : '잠금') : ((widget.locked === true || widget.movable === false) ? 'Unlock movement' : 'Lock movement')}`"
    :aria-pressed="(widget.locked === true || widget.movable === false)" @click="commands.updateWidget(widget.id, { movable: (widget.locked === true || widget.movable === false) })"><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path v-for="d in widgetControlIcons.move" :key="d" :d="d" /></svg></button>
  <button type="button" :title="locale === 'ko' ? '삭제' : 'Remove'" data-widget-action="remove" class="comins-grid-layout-widget__action--danger" :aria-label="locale === 'ko' ? `${widget.title} 삭제` : `Remove ${widget.title}`" @click="commands.removeWidget(widget.id)"><VueIcon name="Trash2" /></button>
</template>
