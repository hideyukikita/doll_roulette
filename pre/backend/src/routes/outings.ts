/**
 * お出かけ日記 API
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import * as outingsService from "../services/outingsService.js";

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
    const id = req.params.id ?? "temp";
    const uniq = crypto.randomUUID().slice(0, 8);
    cb(null, `outing-${id}-${uniq}${safeExt}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("画像ファイル（JPEG/PNG/GIF/WebP）のみアップロードできます"));
    }
  },
});

/** GET /api/outings - 一覧（概要） */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const list = await outingsService.getOutings(50);
    res.json(list);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("does not exist") || (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "42P01")) {
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
    if (msg.includes("does not exist") || (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "42P01")) {
      res.status(404).json({ error: "指定のお出かけ日記が見つかりません" });
      return;
    }
    res.status(500).json({ error: "取得に失敗しました" });
  }
});

/** PUT /api/outings/:id - 更新（場所・日付・コメント・一緒に行った家族。画像は変更しない） */
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
    res.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
    const userMessage = msg?.includes("foreign key") || code === "23503"
      ? "選択した家族のデータが見つかりません。"
      : "更新に失敗しました";
    res.status(500).json({ error: userMessage });
  }
});

/** POST /api/outings - 登録（JSON: place, outing_date, comment, doll_ids） */
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
      userMessage = "お出かけ日記用のテーブルがありません。db/init/02_outings.sql を実行してください。";
    } else if (msg.includes("foreign key") || code === "23503") {
      userMessage = "選択した家族のデータが見つかりません。ページを再読み込みしてやり直してください。";
    } else if (msg) {
      userMessage = msg;
    }
    res.status(500).json({ error: userMessage });
  }
});

/** POST /api/outings/:id/images/remove - 画像1枚削除（※ images より先に定義） */
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
    const updated = await outingsService.getOutingById(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "画像の削除に失敗しました" });
  }
});

/** POST /api/outings/:id/images - 複数画像アップロード（枚数制限なし・家庭内運用） */
const maxImages = 100;
router.post(
  "/:id/images",
  (req: Request, res: Response, next: () => void) => {
    upload.array("images", maxImages)(req, res, (err: unknown) => {
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
      const imageUrls = files.map((f, i) => ({ url: `/uploads/${f.filename}`, sortOrder: i }));
      await outingsService.addOutingImages(id, imageUrls);
      const updated = await outingsService.getOutingById(id);
      res.json(updated);
    } catch (err) {
      (files || []).forEach((f) => {
        if (f.path && fs.existsSync(f.path)) fs.unlink(f.path, () => {});
      });
      const msg = err instanceof Error ? err.message : String(err);
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      let userMessage = "画像のアップロードに失敗しました";
      if (msg.includes("does not exist") || code === "42P01") {
        userMessage = "複数画像用のテーブルがありません。db/init/03_outing_images.sql を実行してください。";
      } else if (msg) {
        userMessage = msg;
      }
      res.status(500).json({ error: userMessage });
    }
  }
);

/** POST /api/outings/:id/image - 画像1枚アップロード（後方互換） */
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
      const imageUrl = `/uploads/${req.file.filename}`;
      await outingsService.addOutingImages(id, [{ url: imageUrl, sortOrder: 0 }]);
      const updated = await outingsService.getOutingById(id);
      res.json(updated);
    } catch (err) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, () => {});
      }
      res.status(500).json({ error: "画像のアップロードに失敗しました" });
    }
  }
);

/** DELETE /api/outings/:id - 日記ごと削除（※ /:id/images より後に定義すること） */
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
