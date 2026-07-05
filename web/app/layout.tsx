import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Trainer Portal",
  description: "Panel trenera — plany treningowe dla klientów",
};

const NAV = [
  { href: "/", label: "Panel" },
  { href: "/clients", label: "Klienci" },
  { href: "/exercises", label: "Ćwiczenia" },
  { href: "/plans", label: "Plany" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
        <div className="flex min-h-screen">
          <aside className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 px-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 font-black text-zinc-950">
                T
              </span>
              <span className="text-lg font-bold tracking-tight">
                Trainer<span className="text-yellow-400">Portal</span>
              </span>
            </Link>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-yellow-400 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-8 max-w-6xl">{children}</main>
        </div>
      </body>
    </html>
  );
}
