import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Darmowy raport tygodnia",
  description:
    "Przysyłasz arkusz albo zrzuty. W 24 godziny masz raport podopiecznych i trzy wiadomości. Bezpłatnie, pięć miejsc.",
  alternates: { canonical: "/wdrozenie" },
};

export default function WdrozenieLayout({ children }: { children: React.ReactNode }) {
  return children;
}
