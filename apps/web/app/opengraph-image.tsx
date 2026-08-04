import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Workout Alchemist — układasz plan, widzisz każdą serię";
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
          background: "#0C0D0C",
          padding: 72,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 12, height: 12, background: "#C6F135" }} />
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#F2F4EC",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            Workout Alchemist
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#F2F4EC",
              lineHeight: 1.1,
              maxWidth: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Układasz plan. Widzisz każdą serię.
          </div>
          <div style={{ fontSize: 22, color: "#9AA193", maxWidth: 640, lineHeight: 1.45 }}>
            Wysyłasz klientowi jeden link. On trenuje w telefonie, Ty widzisz każdy trening.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 20,
            fontSize: 15,
            color: "#6E7566",
          }}
        >
          <span>Wczesny dostęp za darmo</span>
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
