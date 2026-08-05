import type { Metadata, Viewport } from "next";
import { Archivo, Fraunces, IBM_Plex_Mono, Instrument_Serif, Space_Grotesk } from "next/font/google";
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

const fontSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
});

/** Landing display — variable opsz/SOFT/WONK (awwwards editorial). */
const fontFraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Workout Alchemist",
    template: "%s · Workout Alchemist",
  },
  description:
    "Układasz plan. Widzisz każdą serię. Wysyłasz klientowi jeden link — on zapisuje serie w telefonie, Ty widzisz każdy trening na żywo.",
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "Workout Alchemist",
    title: "Workout Alchemist — układasz plan, widzisz każdą serię",
    description:
      "Wysyłasz klientowi jeden link. On trenuje w telefonie, Ty widzisz każdy trening na żywo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Workout Alchemist — układasz plan, widzisz każdą serię",
    description:
      "Wysyłasz klientowi jeden link. On trenuje w telefonie, Ty widzisz każdy trening na żywo.",
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
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable} ${fontSerif.variable} ${fontFraunces.variable} h-full antialiased`}
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
