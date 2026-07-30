import type { ReactNode } from "react";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-lg px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-4">
        {children}
      </main>
    </div>
  );
}
