import { ImageResponse } from "next/og";
import { BrandMarkIcon } from "@/lib/brandMark";

export const runtime = "edge";

const ALLOWED = new Set(["180", "192", "512", "512-maskable"]);

export async function GET(
  _req: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size: raw } = await context.params;
  if (!ALLOWED.has(raw)) {
    return new Response("Not found", { status: 404 });
  }
  const maskable = raw === "512-maskable";
  const px = maskable ? 512 : Number(raw);

  return new ImageResponse(<BrandMarkIcon size={px} maskable={maskable} />, {
    width: px,
    height: px,
  });
}
