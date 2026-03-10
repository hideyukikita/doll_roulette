/**
 * お出かけ日記 API ルート（ストレージ層を利用）
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import crypto from "crypto";
import { getStorage } from "../storage/index.js";
import { storageConfig } from "../config/storage.js";
import * as outingsService from "../services/outingsService.js";

const router = Router();
const storage = getStorage();

const memoryStorage = multer.memoryStorage();
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (storageConfig.allowedMimeTypes.includes(file.mimetype as typeof storageConfig.allowedMimeTypes[number])) {
    cb(null, true);
  } else {
    cb(new Error("画像ファイル（JPEG/PNG/GIF/WebP）のみアップロードできます"));
  }
};
const upload = multer({ storage: memoryStorage, fileFilter });

function getExt(mimetype: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png",
    "image/gif": ".gif", "image/webp": ".webp",
  };
  return map[mimetype] ?? ".jpg";
}

/** GET /api/outings - 一覧 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const list = await outingsService.getOutings(50);
    res.json(list);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
    if (msg.includes("does not exist") || code === "42P01") {
      res.json([]);
      return;
    }
    res.status(500).json({ error: "一覧の取得に失敗しました" });
  }
});

/** GET /api/outings/:id - 1件詳細 */
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const outing = await outingsService.getOutingById(id);
    if (!outing) {
      res.status(404).json({ error: "指定のお出かけ日記が見つかりません" });
      return;
    }
    res.json(outing);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
    if (msg.includes("does not exist") || code === "42P01") {
      res.status(404).json({ error: "指定のお出かけ日記が見つかりません" });
      return;
    }
    res.status(500).json({ error: "取得に失敗しました" });
  }
});

/** PUT /api/outings/:id - 更新 */
router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body as { place?: string; outing_date?: string; comment?: string; doll_ids?: string[] };
  const place = body.place?.trim();
  const outing_date = body.outing_date;
  const doll_ids = Array.isArray(body.doll_ids) ? body.doll_ids : [];
  if (!place || !outing_date) {
    res.status(400).json({ error: "場所と日付は必須です" });
    return;
  }
  try {
    const updated = await outingsService.updateOuting(id, {
      place,
      outing_date,
      comment: body.comment ?? null,
      doll_ids,
    });
    if (!updated) {
      res.status(404).json({ error: "指定のお出かけ日記が見つかりません" });
      return;
    }
    const withImages = await outingsService.getOutingById(id);
    res.json(withImages ?? updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
    const userMessage = msg?.includes("foreign key") || code === "23503"
      ? "選択した家族のデータが見つかりません。"
      : "更新に失敗しました";
    res.status(500).json({ error: userMessage });
  }
});

/** POST /api/outings - 登録 */
router.post("/", async (req: Request, res: Response) => {
  const body = req.body as { place?: string; outing_date?: string; comment?: string; doll_ids?: string[] };
  const place = body.place?.trim();
  const outing_date = body.outing_date;
  const doll_ids = Array.isArray(body.doll_ids) ? body.doll_ids : [];
  if (!place || !outing_date) {
    res.status(400).json({ error: "場所と日付は必須です" });
    return;
  }
  try {
    const outing = await outingsService.createOuting({
      place,
      outing_date,
      comment: body.comment ?? null,
      doll_ids,
    });
    res.status(201).json(outing);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
    let userMessage = "登録に失敗しました";
    if (msg.includes("does not exist") || code === "42P01") {
      userMessage = "お出かけ日記用のテーブルがありません。";
    } else if (msg.includes("foreign key") || code === "23503") {
      userMessage = "選択した家族のデータが見つかりません。ページを再読み込みしてやり直してください。";
    } else if (msg) {
      userMessage = msg;
    }
    res.status(500).json({ error: userMessage });
  }
});

/** POST /api/outings/:id/images/remove */
router.post("/:id/images/remove", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body as { image_url?: string };
  const imageUrl = typeof body?.image_url === "string" ? body.image_url.trim() : "";
  if (!imageUrl) {
    res.status(400).json({ error: "image_url を指定してください" });
    return;
  }
  try {
    const deleted = await outingsService.deleteOutingImage(id, imageUrl);
    if (!deleted) {
      res.status(404).json({ error: "指定の画像が見つかりません" });
      return;
    }
    try {
      await storage.delete(imageUrl);
    } catch {
      // ファイル削除失敗は無視
    }
    const updated = await outingsService.getOutingById(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "画像の削除に失敗しました" });
  }
});

const maxImages = 100;
/** POST /api/outings/:id/images - 複数画像アップロード */
router.post(
  "/:id/images",
  upload.array("images", maxImages),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      res.status(400).json({ error: "画像ファイルを1枚以上選択してください" });
      return;
    }
    try {
      const outing = await outingsService.getOutingById(id);
      if (!outing) {
        res.status(404).json({ error: "指定のお出かけ日記が見つかりません" });
        return;
      }
      const imageUrls: { url: string; sortOrder: number }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = getExt(f.mimetype);
        const relativePath = `outings/${id}/${crypto.randomUUID()}${ext}`;
        const savedPath = await storage.save(f.buffer, relativePath);
        imageUrls.push({ url: savedPath, sortOrder: i });
      }
      await outingsService.addOutingImages(id, imageUrls);
      const updated = await outingsService.getOutingById(id);
      res.json(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "画像のアップロードに失敗しました";
      res.status(500).json({ error: msg });
    }
  }
);

/** POST /api/outings/:id/image - 画像1枚（後方互換） */
router.post(
  "/:id/image",
  upload.single("image"),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!req.file) {
      res.status(400).json({ error: "画像ファイルを選択してください" });
      return;
    }
    try {
      const ext = getExt(req.file.mimetype);
      const relativePath = `outings/${id}/${crypto.randomUUID()}${ext}`;
      const savedPath = await storage.save(req.file.buffer, relativePath);
      await outingsService.addOutingImages(id, [{ url: savedPath, sortOrder: 0 }]);
      const updated = await outingsService.getOutingById(id);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "画像のアップロードに失敗しました" });
    }
  }
);

/** DELETE /api/outings/:id */
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await outingsService.deleteOuting(id);
    if (!deleted) {
      res.status(404).json({ error: "指定のお出かけ日記が見つかりません" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "削除に失敗しました" });
  }
});

export default router;
