import { createApp } from "vue";
import App from "./App.vue";
import "gridstack/dist/gridstack.min.css";
import "../../../src/styles.css";
import "../styles.css";
import { resolveExample } from '../shared/example-catalog';
import { frameworkExamplePath } from '../shared/framework-navigation';
const query = new URLSearchParams(location.search);
const example = resolveExample(query.get('example') ?? '');
if (example && query.get('embed') !== '1') {
  location.replace(`${frameworkExamplePath(example.id, 'vue')}?locale=${query.get('locale') === 'en' ? 'en' : 'ko'}`);
} else createApp(App).mount("#app");
