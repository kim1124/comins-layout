import { resolvePlaygroundPath } from "../playground/routes";
import { resolveExample, type Framework } from "./example-catalog";

export function resolveFrameworkRoute(pathname: string) {
  const suffix = pathname.match(/\/(react|vue)$/);
  const base = suffix ? pathname.slice(0, -suffix[0].length) : pathname;
  const path = resolvePlaygroundPath(base);
  const example = path && resolveExample(path.replace(/^\/examples\//, ""));
  return example ? { example, framework: (suffix?.[1] ?? "react") as Framework, explicit: Boolean(suffix) } : undefined;
}

export function frameworkExamplePath(id: string, framework: Framework) {
  const example = resolveExample(id);
  if (!example) throw new Error("Unsupported example ID");
  return `${example.path}/${framework}`;
}
