export const PASTEL_COLORS = [
  { key: "mint", background: "#dcfce7", foreground: "#14532d" },
  { key: "sky", background: "#e0f2fe", foreground: "#0c4a6e" },
  { key: "lemon", background: "#fef9c3", foreground: "#713f12" },
  { key: "peach", background: "#ffedd5", foreground: "#7c2d12" },
  { key: "lavender", background: "#ede9fe", foreground: "#4c1d95" },
  { key: "rose", background: "#ffe4e6", foreground: "#881337" },
] as const;

export type PastelColorKey = (typeof PASTEL_COLORS)[number]["key"];

export function pastelKeyForIndex(index: number): PastelColorKey {
  const normalizedIndex = ((index % PASTEL_COLORS.length) + PASTEL_COLORS.length) % PASTEL_COLORS.length;
  return PASTEL_COLORS[normalizedIndex]!.key;
}

export function pastelColor(key: PastelColorKey) {
  return PASTEL_COLORS.find((color) => color.key === key)!;
}

export function isPastelColorKey(value: unknown): value is PastelColorKey {
  return PASTEL_COLORS.some((color) => color.key === value);
}
