import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { slugsPublicados } from "@/lib/consultas";

export const revalidate = 3600;

// Todos os posts publicados, não só os da capa: link antigo continua achável.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL;
  const posts = await slugsPublicados();
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/arquivo`, changeFrequency: "weekly", priority: 0.6 },
    ...posts.map((p) => ({
      url: `${base}/post/${p.slug}`,
      lastModified: p.atualizado_em,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
