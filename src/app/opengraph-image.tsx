import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — sneakers e streetwear`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagem padrão de compartilhamento (WhatsApp, Instagram, X). Mesmas cores e tipo do site, versão escura. */
export default async function Image() {
  const display = await readFile(join(process.cwd(), "src/assets/fonts/unbounded-600.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: "#0b0b0b",
          color: "#f1eeec",
          fontFamily: "Unbounded",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: 2,
            color: "#a19d9a",
          }}
        >
          <span>{siteConfig.city}</span>
          <span>pix · {siteConfig.maxInstallments}x sem juros · todo o brasil</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 180, lineHeight: 0.9, letterSpacing: -8 }}>{siteConfig.name}</div>
          <div style={{ marginTop: 32, fontSize: 34, color: "#a19d9a", letterSpacing: -0.5 }}>
            sneakers e streetwear.
          </div>
        </div>
        <div style={{ display: "flex", height: 8, width: 160, background: "#da5f6b" }} />
      </div>
    ),
    { ...size, fonts: [{ name: "Unbounded", data: display, weight: 600, style: "normal" }] },
  );
}
