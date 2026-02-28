-- お出かけ日記の複数画像
CREATE TABLE IF NOT EXISTS outing_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outing_id UUID NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outing_images_outing_id ON outing_images(outing_id);
