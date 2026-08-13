export type PlaygroundEventEntry =
  | { name: "onColumnsChange"; columns: number }
  | { name: "onLayoutCommit"; columns: number }
  | {
    name: "onWidgetDragStart" | "onWidgetDragStop" | "onWidgetResizeStart" | "onWidgetResizeStop";
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }
  | { name: "onWidgetResizeFrame"; id: string; width: number; height: number };

const DEFAULT_EVENT_LIMIT = 10;

function finite(value: number) {
  return Number.isFinite(value);
}

function normalizeEvent(entry: PlaygroundEventEntry): PlaygroundEventEntry | undefined {
  switch (entry.name) {
    case "onColumnsChange":
    case "onLayoutCommit":
      return finite(entry.columns) ? { name: entry.name, columns: entry.columns } : undefined;
    case "onWidgetDragStart":
    case "onWidgetDragStop":
    case "onWidgetResizeStart":
    case "onWidgetResizeStop":
      return entry.id.length > 0 && finite(entry.x) && finite(entry.y) && finite(entry.w) && finite(entry.h)
        ? { name: entry.name, id: entry.id, x: entry.x, y: entry.y, w: entry.w, h: entry.h }
        : undefined;
    case "onWidgetResizeFrame":
      return entry.id.length > 0 && finite(entry.width) && finite(entry.height)
        ? { name: entry.name, id: entry.id, width: entry.width, height: entry.height }
        : undefined;
  }
}

export function appendBoundedEvent(
  entries: PlaygroundEventEntry[],
  entry: PlaygroundEventEntry,
  limit = DEFAULT_EVENT_LIMIT,
): PlaygroundEventEntry[] {
  const normalized = normalizeEvent(entry);
  if (!normalized) {
    return entries;
  }

  const boundedLimit = Number.isFinite(limit)
    ? Math.max(0, Math.floor(limit))
    : DEFAULT_EVENT_LIMIT;
  if (boundedLimit === 0) {
    return [];
  }

  return [...entries, normalized].slice(-boundedLimit);
}
