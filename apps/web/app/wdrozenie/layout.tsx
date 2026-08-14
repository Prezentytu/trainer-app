import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "30 minut wdrożenia",
  description:
    "W 30 minut przenosisz plan do linku bez konta. 10 miejsc w miesiącu. 90 dni za 0 zł, do 15 osób. Jeśli w 14 dni nikt nie dokończy treningu — 0 zł.",
  alternates: { canonical: "/wdrozenie" },
};

export default function WdrozenieLayout({ children }: { children: React.ReactNode }) {
  return children;
}
