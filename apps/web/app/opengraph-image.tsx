import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Workout Alchemist — studio trenera personalnego";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0b0c",
          padding: 64,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#3e9c8f",
              color: "#04120f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            WA
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#f3f1ec" }}>
            Workout <span style={{ color: "#3e9c8f" }}>Alchemist</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 56, fontWeight: 700, color: "#f3f1ec", lineHeight: 1.15, maxWidth: 900 }}>
            Programuj treningi, nie arkusze.
          </div>
          <div style={{ fontSize: 24, color: "#c8c7c1", maxWidth: 720, lineHeight: 1.4 }}>
            Kreator planów · logger sesji · portal klienta bez konta
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, fontSize: 18, color: "#93958f" }}>
          <span>Bez karty</span>
          <span>·</span>
          <span>Eksport JSON</span>
          <span>·</span>
          <span>Wczesny dostęp</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
