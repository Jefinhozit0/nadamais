import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // Fotos enviadas pelo painel admin ficam no Supabase Storage (bucket público "produtos")
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  partialPrefetching: true,
  // a imagem OG lê a fonte com readFile em tempo de execução: garante que ela vá junto no deploy
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/fonts/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
