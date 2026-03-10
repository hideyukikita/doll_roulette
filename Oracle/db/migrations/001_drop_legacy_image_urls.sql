-- 既存DB用: dolls.image_url / outings.image_url を *_images に移行してからカラム削除
-- 実行前にバックアップを取得すること。新規構築（01_schema.sql のみ実行）の場合は不要。

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dolls' AND column_name = 'image_url') THEN
    INSERT INTO doll_images (id, doll_id, image_url, sort_order, created_at)
    SELECT uuid_generate_v4(), id, image_url, 0, now() FROM dolls WHERE image_url IS NOT NULL;
    ALTER TABLE dolls DROP COLUMN image_url;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'outings' AND column_name = 'image_url') THEN
    INSERT INTO outing_images (id, outing_id, image_url, sort_order, created_at)
    SELECT uuid_generate_v4(), id, image_url, 0, now() FROM outings WHERE image_url IS NOT NULL;
    ALTER TABLE outings DROP COLUMN image_url;
  END IF;
END $$;
