<script setup lang="ts">
import LifecycleFixture from "./fixtures/LifecycleFixture.vue";
import ParityFixture from "./fixtures/ParityFixture.vue";
import ReactiveInputsFixture from "./fixtures/ReactiveInputsFixture.vue";
import { defineAsyncComponent } from "vue";
import { exampleCatalog, resolveExample } from "../shared/example-catalog";
import { readExampleLocale } from "../shared/locale";
import { getVueExample } from "./examples/registry";
const example = new URLSearchParams(location.search).get("example");
const definition = resolveExample(example ?? "");
const entry = definition && getVueExample(definition.id);
const component = entry ? defineAsyncComponent(entry.component) : undefined;
const locale = readExampleLocale(location.search);
const embedded = new URLSearchParams(location.search).get("embed") === "1";
document.documentElement.lang = locale;
</script>
<template>
  <LifecycleFixture v-if="example === '__test__/lifecycle'" />
  <ParityFixture v-else-if="example === '__test__/parity'" />
  <ReactiveInputsFixture v-else-if="example === '__test__/reactive-inputs'" />
  <main v-else class="vue-playground" data-framework="vue">
    <nav v-if="!embedded" :aria-label="locale === 'ko' ? '예제 메뉴' : 'Example menu'">
      <a v-for="item in exampleCatalog" :key="item.id" :href="`/vue.html?example=${encodeURIComponent(item.id)}&locale=${locale}`">{{ item.label[locale] }}</a>
    </nav>
    <template v-if="definition && component">
      <h1>{{ definition.label[locale] }} · Vue 3</h1>
      <component :is="component" :example-id="definition.id" :locale="locale" />
    </template>
    <p v-else role="alert">{{ locale === 'ko' ? '지원하지 않는 Vue 예제입니다. 메뉴에서 예제를 선택하세요.' : 'Unsupported Vue example. Select an example from the menu.' }}</p>
  </main>
</template>
<style>
.vue-playground { font:14px/1.6 system-ui,sans-serif; color:#172033; max-width:1280px; margin:auto; padding:16px; }
.vue-playground nav,.vue-controls { display:flex; flex-wrap:wrap; gap:8px; margin:12px 0; }
.vue-playground button,.vue-playground select,.vue-playground input { font:inherit; }
.vue-playground button,.vue-playground select { padding:6px 10px; }
.vue-playground textarea { display:block; width:100%; box-sizing:border-box; min-height:100px; }
.vue-playground pre { white-space:pre-wrap; overflow-wrap:anywhere; }
.vue-stage-heading { display:flex; align-items:center; justify-content:space-between; }
.vue-transfer-grids { display:flex; gap:16px; }
@media(max-width:600px) { .vue-transfer-grids { flex-direction:column; } }
</style>
