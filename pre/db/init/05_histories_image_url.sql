-- 当選履歴に「当選時に表示した画像URL」を保持（複数画像対応）
-- 既存DBに対して1回実行:
--   cat db/init/05_histories_image_url.sql | docker compose exec -T db psql -U doll_roulette -d doll_roulette
ALTER TABLE histories
  ADD COLUMN IF NOT EXISTS doll_image_url VARCHAR(255) DEFAULT NULL;

