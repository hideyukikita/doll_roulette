/**
 * 当選履歴の型定義（design.md histories テーブル + 表示用 name）
 */
export interface HistoryRecord {
  id: string;
  doll_id: string;
  selected_at: string;
  doll_name: string;
}
