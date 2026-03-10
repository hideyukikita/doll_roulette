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
