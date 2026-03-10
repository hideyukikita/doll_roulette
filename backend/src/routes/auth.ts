/**
 * 入室用パスワード認証（最初に表示するゲート）
 * APP_PASSWORD が未設定の場合は認証なしで通過
 */
import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();
const APP_PASSWORD = process.env.APP_PASSWORD ?? "";
const COOKIE_NAME = "dr_auth";
const COOKIE_MAX_AGE_DAYS = 7;

function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;)\\s*${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1].trim()) : null;
}

function createAuthToken(): string {
  if (!APP_PASSWORD) return "";
  return crypto.createHmac("sha256", APP_PASSWORD).update("auth").digest("hex");
}

function verifyAuthToken(token: string | null): boolean {
  if (!APP_PASSWORD) return true; // パスワード未設定なら常にOK
  if (!token) return false;
  const expected = Buffer.from(createAuthToken(), "hex");
  let actual: Buffer;
  try {
    actual = Buffer.from(token, "hex");
  } catch {
    return false;
  }
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

/** POST /api/auth/login - パスワード照合し、OK なら Cookie をセット */
router.post("/login", (req: Request, res: Response) => {
  if (!APP_PASSWORD) {
    return res.status(200).json({ ok: true });
  }
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (password !== APP_PASSWORD) {
    return res.status(401).json({ error: "パスワードが違います" });
  }
  const token = createAuthToken();
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  });
  res.status(200).json({ ok: true });
});

/** GET /api/auth/check - Cookie が有効なら 200、無効なら 401 */
router.get("/check", (req: Request, res: Response) => {
  if (!APP_PASSWORD) {
    return res.status(200).json({ ok: true });
  }
  const token = getCookieValue(req.headers.cookie, COOKIE_NAME);
  if (verifyAuthToken(token)) {
    return res.status(200).json({ ok: true });
  }
  res.status(401).json({ error: "未認証" });
});

/** API・/uploads 用の認証ミドルウェア（APP_PASSWORD 未設定時は通過） */
export function requireAuth(
  req: Request,
  res: Response,
  next: () => void
): void {
  if (!APP_PASSWORD) {
    next();
    return;
  }
  const token = getCookieValue(req.headers.cookie, COOKIE_NAME);
  if (verifyAuthToken(token)) {
    next();
    return;
  }
  res.status(401).json({ error: "パスワードを入力してください" });
}

export default router;
export { getCookieValue, verifyAuthToken, COOKIE_NAME };
