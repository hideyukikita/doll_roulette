/**
 * かぞくたち API ルート（ストレージ層を利用）
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import crypto from "crypto";
import { getStorage } from "../storage/index.js";
import { storageConfig } from "../config/storage.js";
import * as dollsService from "../services/dollsService.js";
import type { CreateDollBody } from "../types/doll.js";

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
const uploadMulti = multer({ storage: memoryStorage, fileFilter });

function getExt(mimetype: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };
  return map[mimetype] ?? ".jpg";
}

/** GET /api/dolls - 一覧 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const dolls = await dollsService.getDolls();
    res.json(dolls);
  } catch (err) {
    res.status(500).json({ error: "一覧の取得に失敗しました" });
  }
});

/** POST /api/dolls - 登録 */
router.post("/", async (req: Request, res: Response) => {
  const body = req.body as Partial<CreateDollBody>;
  const name = body?.name?.trim();
  const color = body?.color?.trim();
  if (!name || !color) {
    res.status(400).json({ error: "name と color は必須です" });
    return;
  }
  try {
    const doll = await dollsService.createDoll({ name, color });
    res.status(201).json(doll);
  } catch (err) {
    res.status(500).json({ error: "登録に失敗しました" });
  }
});

/** POST /api/dolls/:id/image - 代表画像アップロード */
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
      const doll = await dollsService.getDollById(id);
      if (!doll) {
        res.status(404).json({ error: "指定のかぞくが見つかりません" });
        return;
      }
      const ext = getExt(req.file.mimetype);
      const relativePath = `dolls/${id}/${crypto.randomUUID()}${ext}`;
      const savedPath = await storage.save(req.file.buffer, relativePath);
      const updated = await dollsService.setDollRepresentativeImage(id, savedPath);
      res.json(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "画像のアップロードに失敗しました";
      res.status(500).json({ error: msg });
    }
  }
);

/** POST /api/dolls/:id/images/remove */
router.post("/:id/images/remove", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body as { image_url?: string };
  const imageUrl = typeof body?.image_url === "string" ? body.image_url.trim() : "";
  if (!imageUrl) {
    res.status(400).json({ error: "image_url を指定してください" });
    return;
  }
  try {
    const deleted = await dollsService.deleteDollImage(id, imageUrl);
    if (!deleted) {
      res.status(404).json({ error: "指定の画像が見つかりません" });
      return;
    }
    try {
      await storage.delete(imageUrl);
    } catch {
      // ファイル削除失敗は無視（DB からは削除済み）
    }
    const updated = await dollsService.getDollById(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "画像の削除に失敗しました" });
  }
});

const maxDollImages = 100;
/** POST /api/dolls/:id/images - 複数画像アップロード */
router.post(
  "/:id/images",
  uploadMulti.array("images", maxDollImages),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      res.status(400).json({ error: "画像ファイルを1枚以上選択してください" });
      return;
    }
    try {
      const doll = await dollsService.getDollById(id);
      if (!doll) {
        res.status(404).json({ error: "指定のかぞくが見つかりません" });
        return;
      }
      const imageUrls: { url: string; sortOrder: number }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = getExt(f.mimetype);
        const relativePath = `dolls/${id}/${crypto.randomUUID()}${ext}`;
        const savedPath = await storage.save(f.buffer, relativePath);
        imageUrls.push({ url: savedPath, sortOrder: i });
      }
      await dollsService.addDollImages(id, imageUrls);
      const updated = await dollsService.getDollById(id);
      res.json(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "画像のアップロードに失敗しました";
      res.status(500).json({ error: msg });
    }
  }
);

/** PUT /api/dolls/:id - 更新 */
router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body as Partial<CreateDollBody>;
  const name = body?.name?.trim();
  const color = body?.color?.trim();
  if (!name || !color) {
    res.status(400).json({ error: "name と color は必須です" });
    return;
  }
  try {
    const doll = await dollsService.updateDoll(id, { name, color });
    if (!doll) {
      res.status(404).json({ error: "指定のかぞくが見つかりません" });
      return;
    }
    res.json(doll);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "更新に失敗しました";
    res.status(500).json({ error: msg });
  }
});

/** DELETE /api/dolls/:id - 削除 */
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await dollsService.deleteDoll(id);
    if (!deleted) {
      res.status(404).json({ error: "指定のかぞくが見つかりません" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "削除に失敗しました" });
  }
});

export default router;
