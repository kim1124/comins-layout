/** Engine registration is read only; importing this helper does not load GridStack. */
export function isDashboardContentPositioned(element: HTMLElement): boolean {
  const grid = element.closest(".grid-stack") as (HTMLElement & { gridstack?: unknown }) | null;
  const item = element.closest(".grid-stack-item") as (HTMLElement & { gridstackNode?: unknown }) | null;
  return Boolean(grid?.gridstack && item?.gridstackNode);
}
