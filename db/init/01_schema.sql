-- かぞくたちルーレット 初期スキーマ（リファクタ後: 画像は *_images に集約）
-- PostgreSQL 起動時に /docker-entrypoint-initdb.d で実行

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- かぞく（代表画像は doll_images の sort_order 最小の1件）
CREATE TABLE IF NOT EXISTS dolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) NOT NULL,
    is_selected BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- かぞくの画像（複数可。sort_order の先頭が代表）
CREATE TABLE IF NOT EXISTS doll_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doll_id UUID NOT NULL REFERENCES dolls(id) ON DELETE CASCADE,
    image_url VARCHAR(512) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doll_images_doll_id ON doll_images(doll_id);

-- 当選履歴（当選時に表示した画像URLを保存）
CREATE TABLE IF NOT EXISTS histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doll_id UUID NOT NULL REFERENCES dolls(id) ON DELETE CASCADE,
    doll_image_url VARCHAR(512) DEFAULT NULL,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_histories_doll_id ON histories(doll_id);
CREATE INDEX IF NOT EXISTS idx_histories_selected_at ON histories(selected_at DESC);

-- お出かけ日記（写真は outing_images のみ）
CREATE TABLE IF NOT EXISTS outings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place VARCHAR(255) NOT NULL,
    outing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outing_dolls (
    outing_id UUID NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
    doll_id UUID NOT NULL REFERENCES dolls(id) ON DELETE CASCADE,
    PRIMARY KEY (outing_id, doll_id)
);
CREATE INDEX IF NOT EXISTS idx_outings_outing_date ON outings(outing_date DESC);

CREATE TABLE IF NOT EXISTS outing_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outing_id UUID NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
    image_url VARCHAR(512) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outing_images_outing_id ON outing_images(outing_id);
