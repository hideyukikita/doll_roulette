import type { CSSProperties } from "react";

/**
 * 登録時の色名を表示用スタイルに変換
 * 白・黄など明るい色は白背景で見えないため、背景や濃い色で調整
 */
const COLOR_MAP: Record<string, { color: string; backgroundColor?: string; borderColor?: string }> = {
  茶色: { color: "#8B4513" },
  白: { color: "#374151", backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" },
  ピンク: { color: "#DB2777" },
  グレー: { color: "#6B7280" },
  青: { color: "#2563EB" },
  黄: { color: "#B45309", backgroundColor: "#FEF3C7", borderColor: "#FCD34D" },
  黒: { color: "#111827" },
  その他: { color: "#6B7280" },
};

const DEFAULT_STYLE = { color: "#4B5563", backgroundColor: undefined, borderColor: undefined };

export function getDollColorStyle(colorName?: string): CSSProperties {
  const style = (colorName && COLOR_MAP[colorName]) ?? DEFAULT_STYLE;
  return {
    color: style.color,
    ...(style.backgroundColor && { backgroundColor: style.backgroundColor }),
    ...(style.borderColor && { border: `1px solid ${style.borderColor}` }),
  };
}
