import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Uploaded files live outside /public (which is only read at build time)
// and are served by src/app/uploads/[...path]/route.ts.
export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

const MAX_BYTES = 5 * 1024 * 1024;

/** Saves an uploaded image and returns its public URL, or null when no file was sent. */
export async function saveImage(file: FormDataEntryValue | null, folder: string): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Only JPG, PNG, WEBP, GIF or AVIF images are allowed.");
  if (file.size > MAX_BYTES) throw new Error("Images must be 5 MB or smaller.");

  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });

  const name = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return `/uploads/${folder}/${name}`;
}

export const UPLOAD_MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(IMAGE_TYPES).map(([mime, ext]) => [ext, mime]),
);
