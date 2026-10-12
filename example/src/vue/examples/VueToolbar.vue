<script setup lang="ts">
defineProps<{ locale: 'ko' | 'en'; columns?: number }>();
defineEmits<{ columnsChange: [value: number] }>();
</script>
<template>
  <section :aria-label="locale === 'ko' ? '예제 기능' : 'Example controls'" class="playground-example-toolbar">
    <div class="playground-example-toolbar__actions"><slot /></div>
    <div v-if="columns !== undefined" class="playground-example-toolbar__column">
      <label class="example-select"><span>{{ locale === 'ko' ? '컬럼' : 'Columns' }}</span>
        <select :value="columns" @change="$emit('columnsChange', Number(($event.target as HTMLSelectElement).value))"><option v-for="n in 12" :key="n" :value="n">{{ n }}</option></select>
      </label>
    </div>
  </section>
</template>
