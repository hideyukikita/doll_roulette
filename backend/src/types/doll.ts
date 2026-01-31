/**
 * かぞくたち（doll）の型定義（design.md dolls テーブルに準拠）
 */
export interface Doll {
  id: string;
  name: string;
  color: string;
  image_url: string | null;
  is_selected: boolean;
  created_at: string;
}

export interface CreateDollBody {
  name: string;
  color: string;
}
