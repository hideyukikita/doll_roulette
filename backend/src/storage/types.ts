/**
 * 画像ストレージの抽象インターフェース（ローカル / Object Storage 等の差し替え用）
 */
export interface IStorage {
  /** ファイルを保存し、公開用パス（例: /uploads/dolls/xxx/yyy.jpg）を返す */
  save(buffer: Buffer, relativePath: string): Promise<string>;
  /** ファイルを削除する。パスは save が返した形式 */
  delete(relativePath: string): Promise<void>;
  /** 公開 URL またはパスを返す（静的配信のベース + パス） */
  getPublicPath(savedPath: string): string;
}
