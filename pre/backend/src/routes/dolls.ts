/**
 * かぞくたち API ルート（一覧・登録・削除・画像アップロード）
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import * as dollsService from "../services/dollsService.js";
import type { CreateDollBody } from "../types/doll.js";

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext.toLowerCase())
      ? ext.toLowerCase()
      : ".jpg";
    cb(null, `${req.params.id}${safeExt}`);
  },
});

const storageMulti = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext.toLowerCase())
      ? ext.toLowerCase()
      : ".jpg";
    const id = req.params.id ?? "temp";
    const uniq = crypto.randomUUID().slice(0, 8);
    cb(null, `doll-${id}-${uniq}${safeExt}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (/^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("画像ファイル（JPEG/PNG/GIF/WebP）のみアップロードできます"));
  }
};

const upload = multer({ storage, fileFilter });
const uploadMulti = multer({ storage: storageMulti, fileFilter });

/** GET /api/dolls - 一覧 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const dolls = await dollsService.getDolls();
    res.json(dolls);
  } catch (err) {
    res.status(500).json({ error: "一覧の取得に失敗しました" });
  }
});

/** POST /api/dolls - 登録（body: { name, color }） */
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

/** POST /api/dolls/:id/image - 画像アップロード */
router.post(
  "/:id/image",
  (req: Request, res: Response, next: () => void) => {
    upload.single("image")(req, res, (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : "画像のアップロードに失敗しました";
        res.status(400).json({ error: msg });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!req.file) {
      res.status(400).json({ error: "画像ファイルを選択してください" });
      return;
    }
    try {
      const doll = await dollsService.getDollById(id);
      if (!doll) {
        fs.unlink(req.file.path, () => {});
        res.status(404).json({ error: "指定のかぞくが見つかりません" });
        return;
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      await dollsService.updateDollImage(id, imageUrl);
      const updated = await dollsService.getDollById(id);
      res.json(updated);
    } catch (err) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, () => {});
      }
      const msg = err instanceof Error ? err.message : "画像のアップロードに失敗しました";
      res.status(500).json({ error: msg });
    }
  }
);

/** POST /api/dolls/:id/images/remove - 画像1枚削除（※ images より先に定義） */
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
    const updated = await dollsService.getDollById(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "画像の削除に失敗しました" });
  }
});

const maxDollImages = 100;
/** POST /api/dolls/:id/images - 複数画像アップロード（枚数制限なし・家庭内運用） */
router.post(
  "/:id/images",
  (req: Request, res: Response, next: () => void) => {
    uploadMulti.array("images", maxDollImages)(req, res, (err: unknown) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : "画像のアップロードに失敗しました" });
        return;
      }
      next();
    });
  },
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
        (files || []).forEach((f) => { if (f.path && fs.existsSync(f.path)) fs.unlink(f.path, () => {}); });
        res.status(404).json({ error: "指定のかぞくが見つかりません" });
        return;
      }
      const imageUrls = files.map((f, i) => ({ url: `/uploads/${f.filename}`, sortOrder: i }));
      await dollsService.addDollImages(id, imageUrls);
      const updated = await dollsService.getDollById(id);
      res.json(updated);
    } catch (err) {
      (files || []).forEach((f) => { if (f.path && fs.existsSync(f.path)) fs.unlink(f.path, () => {}); });
      const msg = err instanceof Error ? err.message : "画像のアップロードに失敗しました";
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      const userMessage = (msg.includes("does not exist") || code === "42P01")
        ? "複数画像用のテーブルがありません。db/init/04_doll_images.sql を実行してください。"
        : msg;
      res.status(500).json({ error: userMessage });
    }
  }
);

/** PUT /api/dolls/:id - 更新（body: { name, color }） */
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
