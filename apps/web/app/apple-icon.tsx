import { ImageResponse } from "next/og";
import { BrandMarkIcon } from "@/lib/brandMark";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<BrandMarkIcon size={180} />, {
    width: 180,
    height: 180,
  });
}
