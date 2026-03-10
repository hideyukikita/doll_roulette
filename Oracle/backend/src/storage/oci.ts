/**
 * OCI Object Storage（S3 互換 API）への画像保存
 * 環境変数: OCI_OS_NAMESPACE, OCI_OS_BUCKET, OCI_OS_REGION, OCI_OS_ACCESS_KEY_ID, OCI_OS_SECRET_ACCESS_KEY
 */
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { IStorage } from "./types.js";

const UPLOADS_PATH_PREFIX = "/uploads";

const namespace = process.env.OCI_OS_NAMESPACE ?? "";
const bucket = process.env.OCI_OS_BUCKET ?? "";
const region = process.env.OCI_OS_REGION ?? "ap-tokyo-1";
const accessKeyId = process.env.OCI_OS_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.OCI_OS_SECRET_ACCESS_KEY ?? "";

function buildEndpoint(): string {
  return `https://${namespace}.compat.objectstorage.${region}.oci.customer-oci.com`;
}

export function createOciStorage(): IStorage {
  const client = new S3Client({
    region,
    endpoint: buildEndpoint(),
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  return {
    async save(buffer: Buffer, relativePath: string): Promise<string> {
      const key = relativePath.startsWith(UPLOADS_PATH_PREFIX + "/")
        ? relativePath.slice((UPLOADS_PATH_PREFIX + "/").length)
        : relativePath;
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: getContentType(key),
        })
      );
      return `${UPLOADS_PATH_PREFIX}/${key}`;
    },

    async delete(savedPathOrRelative: string): Promise<void> {
      const key = savedPathOrRelative.startsWith(UPLOADS_PATH_PREFIX + "/")
        ? savedPathOrRelative.slice((UPLOADS_PATH_PREFIX + "/").length)
        : savedPathOrRelative;
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
    },

    getPublicPath(savedPath: string): string {
      return savedPath.startsWith("/") ? savedPath : `${UPLOADS_PATH_PREFIX}/${savedPath}`;
    },

    async getBuffer(relativePath: string): Promise<Buffer | null> {
      const key = relativePath.startsWith(UPLOADS_PATH_PREFIX + "/")
        ? relativePath.slice((UPLOADS_PATH_PREFIX + "/").length)
        : relativePath;
      try {
        const out = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );
        if (!out.Body) return null;
        const chunks: Uint8Array[] = [];
        for await (const chunk of out.Body as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      } catch (e) {
        const err = e as { name?: string };
        if (err.name === "NoSuchKey") return null;
        throw e;
      }
    },
  };
}

function getContentType(key: string): string {
  const ext = key.includes(".") ? key.slice(key.lastIndexOf(".")).toLowerCase() : "";
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return map[ext] ?? "application/octet-stream";
}
