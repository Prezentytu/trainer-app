"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="t-label text-muted">Błąd</p>
      <h1 className="t-heading text-foreground">Coś poszło nie tak</h1>
      <p className="t-body max-w-md text-foreground-secondary">
        Odśwież widok albo wróć za chwilę. Jeśli problem się powtarza, daj znać trenerowi /
        supportowi.
      </p>
      <Button type="button" onClick={reset}>
        Spróbuj ponownie
      </Button>
    </div>
  );
}
