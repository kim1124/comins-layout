import type { GridItemHTMLElement, GridStack } from "gridstack";

let previewSequence = 0;

/** Visual-only snapshot: never register a second engine node or React owner. */
export function beginCopyDragPreview(grid: GridStack, item: GridItemHTMLElement): () => void {
  const node = item.gridstackNode;
  const content = item.querySelector<HTMLElement>(":scope > .grid-stack-item-content");
  if (!node || !content) return () => {};

  const source = item.ownerDocument.createElement("div");
  source.className = "comins-grid-layout-copy-source";
  source.setAttribute("aria-hidden", "true");
  source.inert = true;
  const cellHeight = grid.getCellHeight(true);
  Object.assign(source.style, {
    left: `${((node.x ?? 0) / grid.getColumn()) * 100}%`,
    top: `${(node.y ?? 0) * cellHeight}px`,
    width: `${((node.w ?? 1) / grid.getColumn()) * 100}%`,
    height: `${(node.h ?? 1) * cellHeight}px`,
  });
  if (grid.opts.rtl) {
    source.style.right = source.style.left;
    source.style.left = "auto";
  }
  const snapshot = content.cloneNode(true) as HTMLElement;
  const elements = [snapshot, ...snapshot.querySelectorAll<HTMLElement>("*")];
  const idPrefix = `comins-copy-preview-${++previewSequence}-`;
  const ids = new Map(elements.filter(element => element.id).map((element, index) => [element.id, `${idPrefix}${index}`]));
  // Isolate identities and form membership without removing layout classes.
  elements.forEach(element => {
    if (element.id) element.id = ids.get(element.id)!;
    [...element.attributes].forEach(attribute => {
      if (["name", "form", "data-widget-id", "data-grid-id", "data-testid"].includes(attribute.name) || attribute.name.startsWith("aria-") || attribute.name.startsWith("on")) {
        element.removeAttribute(attribute.name);
      } else if (attribute.name !== "id") {
        const value = attribute.value.replace(/url\(["']?#([^\s)"']+)["']?\)/g, (match, id: string) => ids.has(id) ? `url(#${ids.get(id)})` : match);
        element.setAttribute(attribute.name, value.startsWith("#") && ids.has(value.slice(1)) ? `#${ids.get(value.slice(1))}` : value);
      }
    });
  });
  const originalCanvases = content.querySelectorAll("canvas");
  snapshot.querySelectorAll("canvas").forEach((canvas, index) => {
    const original = originalCanvases[index];
    if (original && original.width && original.height) canvas.getContext("2d")?.drawImage(original, 0, 0);
  });
  const contentStyle = getComputedStyle(content);
  Object.assign(snapshot.style, {
    position: "absolute",
    top: contentStyle.top,
    right: contentStyle.right,
    bottom: contentStyle.bottom,
    left: contentStyle.left,
  });
  source.appendChild(snapshot);
  grid.el.appendChild(source);
  item.classList.add("comins-grid-layout-copy-drag");

  return () => {
    item.classList.remove("comins-grid-layout-copy-drag");
    source.remove();
  };
}
