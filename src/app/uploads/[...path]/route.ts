import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_MIME_BY_EXT, UPLOAD_ROOT } from "@/lib/uploads";

export async function GET(_request: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path: segments } = await ctx.params;
  const file = path.resolve(UPLOAD_ROOT, ...segments);

  // Block path traversal outside the uploads folder.
  if (!file.startsWith(UPLOAD_ROOT + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  const type = UPLOAD_MIME_BY_EXT[path.extname(file).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });

  try {
    const body = await readFile(file);
    return new Response(body, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
