import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] =
  [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/wdrozenie", changeFrequency: "monthly", priority: 0.8 },
    { path: "/ile-tracisz", changeFrequency: "monthly", priority: 0.6 },
    { path: "/gotowce", changeFrequency: "monthly", priority: 0.6 },
    { path: "/checklista", changeFrequency: "monthly", priority: 0.5 },
    { path: "/regulamin", changeFrequency: "yearly", priority: 0.3 },
    { path: "/prywatnosc", changeFrequency: "yearly", priority: 0.3 },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, SITE_URL).href,
    changeFrequency,
    priority,
  }));
}
