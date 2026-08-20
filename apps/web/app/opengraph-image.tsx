import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RepMaxer — wszyscy podopieczni w jednym raporcie";
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
          background: "#0B0C0D",
          padding: 72,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#FFFFFF",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          RepMaxer
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 600,
              color: "#FFFFFF",
              lineHeight: 1.1,
              maxWidth: 900,
              letterSpacing: "-0.02em",
            }}
          >
            Wszyscy podopieczni w jednym raporcie. Za 0 zł, w 24 godziny.
          </div>
          <div style={{ fontSize: 22, color: "#C9CED4", maxWidth: 640, lineHeight: 1.45 }}>
            Wysyłasz arkusz albo zrzuty. Wraca lista i trzy wiadomości. Za 0 zł, w 24 godziny.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 20,
            fontSize: 15,
            color: "#9AA1A8",
          }}
        >
          <span>24 godziny</span>
          <span>·</span>
          <span>Bez opłat</span>
          <span>·</span>
          <span>5 miejsc</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
