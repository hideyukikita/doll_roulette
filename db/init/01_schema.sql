-- ぬいぐるみルーレット 初期スキーマ（design.md に基づく）
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
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_histories_doll_id ON histories(doll_id);
CREATE INDEX IF NOT EXISTS idx_histories_selected_at ON histories(selected_at DESC);
