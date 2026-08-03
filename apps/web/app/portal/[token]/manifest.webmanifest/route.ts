import { NextRequest } from "next/server";

export function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  return context.params.then(({ token }) => {
    const manifest = {
      name: "Workout Alchemist — klient",
      short_name: "WA Klient",
      description: "Twój plan treningowy i logowanie serii",
      start_url: `/portal/${token}`,
      scope: `/portal/${token}`,
      display: "standalone",
      background_color: "#0C0D0C",
      theme_color: "#0C0D0C",
      lang: "pl",
      icons: [
        {
          src: "/icon.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any",
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
