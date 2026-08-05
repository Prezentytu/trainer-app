import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ClerkAppProvider } from "@/components/ClerkAppProvider";

/**
 * SW portalu ma scope `/` i cache'uje `/_next/static` cache-first — w dev daje to stare chunki
 * przy świeżym HTML (błędy hydracji). Inline, bo stary bundle nie zawierałby tego kodu.
 */
const DEV_SW_CLEANUP = `
if (navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); });
if (typeof caches !== "undefined") caches.keys().then(function (ks) { ks.filter(function (k) { return k.indexOf("wa-portal-") === 0; }).forEach(function (k) { caches.delete(k); }); });
`;

const fontDisplay = Archivo({
  variable: "--font-archivo",
  weight: ["700", "800", "900"],
  subsets: ["latin", "latin-ext"],
});

const fontBody = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
});

const fontMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
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
    "Wysyłasz link. Widzisz każdy trening. Klient odhacza serie w telefonie. Bez aplikacji, bez konta.",
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
};

export const viewport: Viewport = {
  themeColor: "#0C0D0C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground">
        {process.env.NODE_ENV === "production" ? null : (
          <script dangerouslySetInnerHTML={{ __html: DEV_SW_CLEANUP }} />
        )}
        <ClerkAppProvider>{children}</ClerkAppProvider>
      </body>
    </html>
  );
}
