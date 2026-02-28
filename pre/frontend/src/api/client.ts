/**
 * API ベース URL
 * - .env の VITE_API_BASE_URL が設定されていればそれを使う
 * - 未設定かつブラウザで「localhost 以外」から開いている場合（スマホ等）は、
 *   同じホスト・ポート3000 を使う（日をまたいでIPが変わってもそのまま使える）
 */
function getBaseUrl(): string {
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env && typeof env === "string" && env.trim() !== "") return env.trim();
  if (typeof window !== "undefined" && window.location?.hostname && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return "http://localhost:3000";
}

const baseUrl = getBaseUrl();

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${p}`;
}
