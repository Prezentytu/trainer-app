import { NextRequest } from "next/server";

export function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  return context.params.then(({ token }) => {
    const scope = `/portal/${token}`;
    const manifest = {
      id: scope,
      name: "Workout Alchemist — klient",
      short_name: "WA Klient",
      description: "Twój plan treningowy i logowanie serii",
      start_url: scope,
      scope,
      display: "standalone",
      orientation: "portrait",
      background_color: "#0C0D0C",
      theme_color: "#0C0D0C",
      lang: "pl",
      categories: ["health", "fitness", "sports"],
      icons: [
        {
          src: "/icons/192",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/512",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/512-maskable",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    };
    return new Response(JSON.stringify(manifest), {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "no-store",
      },
    });
  });
}
