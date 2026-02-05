/**
 * かぞくたち API ルート（一覧・登録・削除・画像アップロード）
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
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

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("画像ファイル（JPEG/PNG/GIF/WebP）のみアップロードできます"));
    }
  },
});

/** GET /api/dolls - 一覧 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const dolls = await dollsService.getDolls();
    res.json(dolls);
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: "登録に失敗しました" });
  }
});

/** POST /api/dolls/:id/image - 画像アップロード */
router.post(
  "/:id/image",
  (req: Request, res: Response, next: () => void) => {
    upload.single("image")(req, res, (err: unknown) => {
      if (err) {
        if (err && typeof err === "object" && "code" in err && err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "ファイルサイズは5MB以下にしてください" });
          return;
        }
        const msg = err instanceof Error ? err.message : "画像のアップロードに失敗しました";
        console.error("Multer error:", err);
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
      console.error("Image upload error:", err);
      const msg = err instanceof Error ? err.message : "画像のアップロードに失敗しました";
      res.status(500).json({ error: msg });
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
    console.error("Update doll error:", err);
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
    console.error(err);
    res.status(500).json({ error: "削除に失敗しました" });
  }
});

export default router;
