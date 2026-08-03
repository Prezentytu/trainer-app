import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Workout Alchemist — plany, które klienci robią";
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
          background: "#0B0D08",
          padding: 64,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 12, height: 12, background: "#C6F135" }} />
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#F2F4EC",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            Workout Alchemist
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#F2F4EC",
              lineHeight: 1.05,
              maxWidth: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.03em",
            }}
          >
            Układasz plan. Widzisz każdą serię<span style={{ color: "#C6F135" }}>.</span>
          </div>
          <div style={{ fontSize: 24, color: "#8A9280", maxWidth: 720, lineHeight: 1.4 }}>
            Ułóż plan, wyślij link — klient trenuje w telefonie.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            fontSize: 14,
            color: "#8A9280",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <span>Za darmo we wczesnym dostępie</span>
          <span>·</span>
          <span>Bez karty</span>
          <span>·</span>
          <span>Klient bez aplikacji</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
