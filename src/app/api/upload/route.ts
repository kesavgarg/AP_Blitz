import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { saveUpload } from "@/lib/files";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role === "BLITZER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = rateLimit(`upload:${user.id}`, 30, 60 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: "Upload limit reached." }, { status: 429 });
  const ipLimit = rateLimit(`upload-ip:${clientIp(req.headers)}`, 60, 60 * 60 * 1000);
  if (!ipLimit.ok) return NextResponse.json({ error: "Upload limit reached." }, { status: 429 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  try {
    const saved = await saveUpload(file, user.id, {
      contentItemId: String(form.get("contentItemId") || "") || undefined,
      designRequestId: String(form.get("designRequestId") || "") || undefined,
    });
    return NextResponse.json({ id: saved.id, filename: saved.filename });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }
}
