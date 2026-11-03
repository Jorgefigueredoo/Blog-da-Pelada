import type { NextConfig } from "next";

const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:55321");

const nextConfig: NextConfig = {
  images: {
    // As imagens do Supabase passam pela CDN da Vercel (100 GB) em vez de
    // gastar o egress do Supabase (5 GB). O Supabase só é tocado no cache miss.
    remotePatterns: [
      {
        protocol: supabase.protocol.replace(":", "") as "http" | "https",
        hostname: supabase.hostname,
        port: supabase.port,
        pathname: "/storage/v1/object/public/midia/**",
      },
    ],
    // Arquivo nunca muda (nome com UUID): cache de 1 ano.
    minimumCacheTTL: 31536000,
    // Poucas larguras e um formato só = poucas variações = poucas transformações
    // (o Hobby dá 5.000/mês). Os arquivos já chegam em WebP, no máximo 1600px.
    formats: ["image/webp"],
    deviceSizes: [640, 828, 1200, 1600],
    imageSizes: [96, 200, 400],
    qualities: [70, 75],
  },
};

export default nextConfig;
