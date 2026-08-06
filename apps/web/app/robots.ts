import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal/", "/sign-in", "/sign-up", "/settings", "/clients", "/exercises", "/plans"],
    },
  };
}
