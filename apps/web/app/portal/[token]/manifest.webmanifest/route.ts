import { NextRequest } from "next/server";
import { fetchPortalTrainerName, portalShortcutName, trainerFirstName } from "@/lib/portalBrand";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const trainerName = await fetchPortalTrainerName(token);
  const first = trainerFirstName(trainerName);
  const shortName = portalShortcutName(trainerName);
  const fullName = first ? `Plan od ${first}` : "RepMaxer";
  const scope = `/portal/${token}`;
  const manifest = {
    id: scope,
    name: fullName,
    short_name: shortName,
    description: first
      ? `Twój plan od ${first} — serie i rekordy`
      : "Twój plan treningowy i logowanie serii",
    start_url: scope,
    scope,
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B0C0D",
    theme_color: "#0B0C0D",
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
}
