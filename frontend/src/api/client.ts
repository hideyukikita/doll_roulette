/**
 * API ベース URL（Vite の環境変数。スマホ接続時は Windows の IP に変更）
 */
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${p}`;
}
