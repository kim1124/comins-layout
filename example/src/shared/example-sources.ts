import type { Framework } from "./example-catalog";
import { resolveExample } from "./example-catalog";

const sources = import.meta.glob<string>(["../playground/**/*.{ts,tsx}", "../vue/examples/*.vue", "../vue/examples/*.ts", "../shared/*.ts", "../components/**/*.tsx"], { query: "?raw", import: "default" });
const vueFile = (id: string) => id.startsWith("widget/") ? "WidgetExamples.vue" : id.startsWith("layout/") ? "LayoutExamples.vue"
  : id.includes("multi-grid") || id.endsWith("external-drop-trash") ? "TransferExample.vue"
  : id.endsWith("lazy-load") ? "LazyExample.vue" : id.endsWith("size-to-content") ? "ContentSizingExample.vue"
  : id.endsWith("responsive") ? "ResponsiveExample.vue" : "AdvancedExamples.vue";
const reactFile = (id: string) => id.startsWith("widget/") ? "WidgetExamples.tsx" : id.startsWith("layout/") ? "LayoutExamples.tsx"
  : id.includes("multi-grid") ? "TransferPlayground.tsx" : id.endsWith("lazy-load") ? "LazyRenderPlayground.tsx"
  : id.endsWith("size-to-content") ? "ContentSizingPlayground.tsx" : id.endsWith("responsive") ? "ResponsivePlayground.tsx" : "AdvancedExamples.tsx";

export async function getExampleSources(id: string, framework: Framework) {
  if (!resolveExample(id)) throw new Error("Unsupported example ID");
  const first = framework === "vue" ? `../vue/examples/${vueFile(id)}` : `../playground/${reactFile(id)}`;
  const files: { path: string; code: string }[] = [];
  const seen = new Set<string>();
  async function visit(path: string) {
    if (seen.has(path) || !sources[path]) return;
    seen.add(path);
    const original = await sources[path]!();
    const code = original.replace(/(["'])\.\.\/(?:\.\.\/)+src(?:\/(vue|react|core))?\1/g, (_match, quote: string, entry?: string) => `${quote}comins-grid-layout/${entry ?? framework}${quote}`);
    files.push({ path: path.replace(/^\.\.\//, ""), code });
    for (const match of original.matchAll(/(?:from\s*|import\s*)(["'])(\.[^"']+)\1/g)) {
      const parts = path.split('/').slice(0, -1);
      for (const part of match[2]!.split('/')) { if (part === '..') parts.pop(); else if (part !== '.') parts.push(part); }
      const base = parts.join('/');
      const dependency = [base, base + '.ts', base + '.tsx', base + '.vue'].find(candidate => sources[candidate]);
      if (dependency) await visit(dependency);
    }
  }
  await visit(first);
  return files;
}
