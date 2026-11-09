import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { getProfile } from "@/server/auth";

const BUCKET = "produtos";
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function normalize(input: Buffer) {
  return sharp(input)
    .rotate() // respeita a orientação do EXIF antes de descartá-lo
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
}

/**
 * Upload de foto de produto (só admin).
 * Converte para WebP (máx. 1600px), remove metadados (EXIF/GPS) e envia ao Supabase Storage.
 * Requer SUPABASE_SECRET_KEY (chave secreta, só no servidor).
 */
export async function POST(request: Request) {
  const profile = await getProfile();
  if (profile?.role !== "admin") return new Response(null, { status: 404 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    return Response.json(
      { error: "Upload desativado: defina SUPABASE_SECRET_KEY no .env.local (veja o README)." },
      { status: 501 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Envie um arquivo." }, { status: 400 });
  if (!ACCEPTED.includes(file.type)) return Response.json({ error: "Use JPG, PNG, WebP ou AVIF." }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Arquivo acima de 8 MB." }, { status: 413 });

  const output = await normalize(Buffer.from(await file.arrayBuffer())).catch(() => null);
  if (!output) return Response.json({ error: "Não consegui ler essa imagem." }, { status: 422 });

  const supabase = createClient(url, secret, { auth: { persistSession: false } });
  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: ["image/webp"],
    });
  }

  const path = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, output.data, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return Response.json({ error: "Falha ao enviar para o Storage." }, { status: 502 });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return Response.json({ src: data.publicUrl, width: output.info.width, height: output.info.height });
}
