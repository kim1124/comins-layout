<script setup lang="ts">
import { exampleIconNodes } from '../../shared/example-icon-nodes';
withDefaults(defineProps<{ name: keyof typeof exampleIconNodes; size?: number }>(), { size: 15 });
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><component :is="node[0]" v-for="(node, index) in exampleIconNodes[name]" :key="index" v-bind="node[1]" /></svg></template>
