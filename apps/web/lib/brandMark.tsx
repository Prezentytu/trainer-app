/** Wspólny znak RM do ImageResponse (ikony / splash) — hexy OK poza CSS tokenami. */

export const BRAND_BG = "#0B0C0D";
export const BRAND_ACCENT = "#FFFFFF";
export const BRAND_FG = "#FFFFFF";

type BrandMarkProps = {
  /** Rozmiar canvasu (kwadrat). */
  size: number;
  /** Maskable: ~20% marginesu bezpieczeństwa wokół znaku. */
  maskable?: boolean;
};

/** Kwadratowa ikona: tło near-black + biały „RM”. */
export function BrandMarkIcon({ size, maskable = false }: BrandMarkProps) {
  const pad = maskable ? size * 0.2 : 0;
  const inner = size - pad * 2;
  const fontSize = Math.round(inner * 0.32);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_BG,
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          fontWeight: 600,
          color: BRAND_FG,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        RM
      </div>
    </div>
  );
}

type SplashProps = {
  width: number;
  height: number;
};

/** Splash iOS: tło near-black + znak na środku. */
export function BrandSplash({ width, height }: SplashProps) {
  const mark = Math.round(Math.min(width, height) * 0.22);
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_BG,
      }}
    >
      <BrandMarkIcon size={mark} />
    </div>
  );
}
