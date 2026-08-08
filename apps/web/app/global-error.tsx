"use client";

import { useEffect } from "react";

/**
 * Awaryjny fallback poza root layout — bez importów z ui.tsx (layout może być zepsuty).
 * Tokeny mono v2 jako inline style (globals.css może nie być załadowany).
 */
export default function GlobalError({
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
    <html lang="pl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0C0D",
          color: "#FFFFFF",
          fontFamily:
            'Instrument Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#9AA1A8",
              fontFamily: "Geist Mono, ui-monospace, monospace",
            }}
          >
            Błąd
          </p>
          <h1 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 500 }}>
            Coś poszło nie tak
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 15, color: "#C9CED4", lineHeight: 1.5 }}>
            Spróbuj odświeżyć stronę. Jeśli problem się powtarza, wróć za chwilę.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              appearance: "none",
              border: 0,
              borderRadius: 8,
              background: "#FFFFFF",
              color: "#0B0C0D",
              fontSize: 14,
              fontWeight: 500,
              padding: "10px 18px",
              cursor: "pointer",
            }}
          >
            Spróbuj ponownie
          </button>
        </div>
      </body>
    </html>
  );
}
