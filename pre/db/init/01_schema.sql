-- かぞくたちルーレット 初期スキーマ（design.md に基づく）
-- PostgreSQL コンテナ起動時に /docker-entrypoint-initdb.d で実行される

-- UUID 拡張を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- dolls テーブル（将来の写真機能用に image_url を含む）
CREATE TABLE IF NOT EXISTS dolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    is_selected BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- histories テーブル（当選履歴）
CREATE TABLE IF NOT EXISTS histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doll_id UUID NOT NULL REFERENCES dolls(id) ON DELETE CASCADE,
    -- 当選時に表示した画像（複数画像対応。NULL の場合は dolls.image_url を表示）
    doll_image_url VARCHAR(255) DEFAULT NULL,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_histories_doll_id ON histories(doll_id);
CREATE INDEX IF NOT EXISTS idx_histories_selected_at ON histories(selected_at DESC);

-- お出かけ日記（場所・日時・どの家族と・写真・コメント）
CREATE TABLE IF NOT EXISTS outings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place VARCHAR(255) NOT NULL,
    outing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    comment TEXT,
    image_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outing_dolls (
    outing_id UUID NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
    doll_id UUID NOT NULL REFERENCES dolls(id) ON DELETE CASCADE,
    PRIMARY KEY (outing_id, doll_id)
);

CREATE INDEX IF NOT EXISTS idx_outings_outing_date ON outings(outing_date DESC);

-- お出かけ日記の複数画像
CREATE TABLE IF NOT EXISTS outing_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outing_id UUID NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outing_images_outing_id ON outing_images(outing_id);

-- かぞくの複数画像（doll_images が無い環境では 04_doll_images.sql を単体実行可）
CREATE TABLE IF NOT EXISTS doll_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doll_id UUID NOT NULL REFERENCES dolls(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doll_images_doll_id ON doll_images(doll_id);
