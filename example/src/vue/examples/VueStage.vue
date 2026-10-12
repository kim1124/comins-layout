<script setup lang="ts">
defineProps<{ kind: 'controls' | 'grid'; locale: 'ko' | 'en'; description?: string }>();
</script>
<template>
  <section :class="['playground-example-stage', 'playground-example-stage--' + kind]">
    <header class="playground-example-stage__header"><div v-if="$slots.actions" class="playground-example-stage__heading"><h2>{{ kind === 'controls' ? (locale === 'ko' ? '제어' : 'Controls') : (locale === 'ko' ? '실행 화면' : 'Live workspace') }}</h2><slot name="actions" /></div><h2 v-else>{{ kind === 'controls' ? (locale === 'ko' ? '제어' : 'Controls') : (locale === 'ko' ? '실행 화면' : 'Live workspace') }}</h2>
      <p>{{ description ?? (kind === 'controls' ? (locale === 'ko' ? '실행 중 옵션을 변경할 수 있습니다.' : 'Change options while the demo is running.') : (locale === 'ko' ? '위젯을 조작하며 설명한 설정과 결과를 확인합니다.' : 'Interact with widgets to observe the documented settings and results.')) }}</p>
    </header><slot />
  </section>
</template>
