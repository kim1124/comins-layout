import { playgroundMenus } from "../playground/routes";
export type Framework = "react" | "vue";
export type ExampleDefinition = { id: string; path: string; label: { ko: string; en: string } };
export const exampleCatalog: readonly ExampleDefinition[] = playgroundMenus.flatMap(menu =>
  menu.submenus.map(item => ({ ...item, id: item.path.replace(/^\/examples\//, "") })),
);
export function resolveExample(id: string): ExampleDefinition | undefined {
  return exampleCatalog.find(item => item.id === id);
}
