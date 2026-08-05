import { ImageResponse } from "next/og";
import { BrandSplash } from "@/lib/brandMark";
import { parseSplashSize } from "@/lib/iosSplash";

export const runtime = "edge";

export async function GET(
  _req: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size: raw } = await context.params;
  const dims = parseSplashSize(raw);
  if (!dims) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(<BrandSplash width={dims.width} height={dims.height} />, {
    width: dims.width,
    height: dims.height,
  });
}
