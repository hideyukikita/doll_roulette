-- かぞく（ぬいぐるみ）の複数画像（既存の dolls.image_url は代表画像として残す）
-- 既存DBで家族の複数画像を使う場合のみ1回実行: cat db/init/04_doll_images.sql | docker compose exec -T db psql -U doll_roulette -d doll_roulette
CREATE TABLE IF NOT EXISTS doll_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doll_id UUID NOT NULL REFERENCES dolls(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doll_images_doll_id ON doll_images(doll_id);
