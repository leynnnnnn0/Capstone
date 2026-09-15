import type { MetadataRoute } from "next";

const siteUrl = "https://sogglassandaluminum.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
