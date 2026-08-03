import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ClerkAppProvider } from "@/components/ClerkAppProvider";

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
    default: "Workout Alchemist",
    template: "%s · Workout Alchemist",
  },
  description:
    "Plany, które klienci robią. Ułóż plan w kilka minut, wyślij link — klient trenuje w telefonie bez instalacji aplikacji.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "WA Klient",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "Workout Alchemist",
    title: "Workout Alchemist — plany, które klienci robią",
    description:
      "Ułóż plan w kilka minut i wyślij klientowi link. On trenuje w telefonie, Ty widzisz każdy trening.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Workout Alchemist — plany, które klienci robią",
    description:
      "Ułóż plan w kilka minut i wyślij klientowi link. On trenuje w telefonie, Ty widzisz każdy trening.",
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
        <ClerkAppProvider>{children}</ClerkAppProvider>
      </body>
    </html>
  );
}
