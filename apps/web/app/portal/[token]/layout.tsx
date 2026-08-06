import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { IOS_SPLASH_ENTRIES } from "@/lib/iosSplash";

export const viewport: Viewport = {
  themeColor: "#0B0C0D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const manifest = `/portal/${token}/manifest.webmanifest`;

  return {
    title: "RepMaxer",
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
    manifest,
    appleWebApp: {
      capable: true,
      title: "RepMaxer",
      statusBarStyle: "black-translucent",
      startupImage: IOS_SPLASH_ENTRIES.map((entry) => ({
        url: `/splash/${entry.size}`,
        media: entry.media,
      })),
    },
    icons: {
      apple: [{ url: "/icons/180", sizes: "180x180", type: "image/png" }],
      icon: [
        { url: "/icons/192", sizes: "192x192", type: "image/png" },
        { url: "/icons/512", sizes: "512x512", type: "image/png" },
      ],
    },
  };
}

export default async function PortalTokenLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PortalShell token={token}>{children}</PortalShell>;
}
