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
  /** 複数画像（doll_images 由来。未設定時は [image_url]） */
  image_urls?: string[];
}

export interface CreateDollBody {
  name: string;
  color: string;
}
