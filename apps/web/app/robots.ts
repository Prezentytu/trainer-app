import type { MetadataRoute } from "next";
import { isPublicMarketingHost } from "@/lib/siteHost";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  if (!isPublicMarketingHost(SITE_URL)) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/portal/",
        "/sign-in",
        "/sign-up",
        "/settings",
        "/clients",
        "/exercises",
        "/plans",
        "/landing-preview",
        "/inbox",
        "/sso-callback",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
