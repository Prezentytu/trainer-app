import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "14 dni do pełnego wglądu",
  description:
    "W 30 min wpinamy plan w link bez konta. 10 miejsc w miesiącu. Gwarancja: trening w 14 dni albo 0 zł.",
};

export default function WdrozenieLayout({ children }: { children: React.ReactNode }) {
  return children;
}
