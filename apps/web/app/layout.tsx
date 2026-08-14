import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkAppProvider } from "@/components/ClerkAppProvider";
import { DevSwCleanup } from "@/components/DevSwCleanup";
import { ThemeBoot } from "@/components/ThemeBoot";

/**
 * SW portalu ma scope `/` i cache'uje `/_next/static` cache-first — w dev daje to stare chunki
 * przy świeżym HTML (błędy hydracji). Inline, bo stary bundle nie zawierałby tego kodu.
 */
const DEV_SW_CLEANUP = `
if (navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); });
if (typeof caches !== "undefined") caches.keys().then(function (ks) { ks.filter(function (k) { return k.indexOf("wa-portal-") === 0 || k.indexOf("rm-portal-") === 0; }).forEach(function (k) { caches.delete(k); }); });
`;

const fontSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RepMaxer",
    template: "%s · RepMaxer",
  },
  description:
    "Klient otwiera link w przeglądarce — bez konta. Po treningu widzisz serie i rekordy. Od razu wiesz, kto nie trenował.",
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "RepMaxer",
    title: "RepMaxer — wysyłasz link, widzisz każdy trening",
    description:
      "Klient odhacza serie w telefonie. Bez aplikacji, bez konta.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepMaxer — wysyłasz link, widzisz każdy trening",
    description:
      "Klient odhacza serie w telefonie. Bez aplikacji, bez konta.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/192", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/180", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0C0D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="preload"
          href="/fonts/phosphor/Phosphor.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Public URL — SW precache'uje ten sam plik dla offline; nie import CSS z bundla. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/fonts/phosphor/style.css" />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <ThemeBoot />
        {process.env.NODE_ENV === "production" ? null : (
          <DevSwCleanup script={DEV_SW_CLEANUP} />
        )}
        <ClerkAppProvider>{children}</ClerkAppProvider>
      </body>
    </html>
  );
}
