/** Wspólny znak WA do ImageResponse (ikony / splash) — hexy OK poza CSS tokenami. */

export const BRAND_BG = "#0C0D0C";
export const BRAND_ACCENT = "#C6F135";
export const BRAND_FG = "#0C0D0C";

type BrandMarkProps = {
  /** Rozmiar canvasu (kwadrat). */
  size: number;
  /** Maskable: ~20% marginesu bezpieczeństwa wokół znaku. */
  maskable?: boolean;
};

/** Kwadratowa ikona: tło ink + zaokrąglony kafelek lime z „WA”. */
export function BrandMarkIcon({ size, maskable = false }: BrandMarkProps) {
  const pad = maskable ? size * 0.2 : 0;
  const inner = size - pad * 2;
  const radius = Math.round(inner * 0.22);
  const fontSize = Math.round(inner * 0.38);

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
          borderRadius: radius,
          background: BRAND_ACCENT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          fontWeight: 800,
          color: BRAND_FG,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.04em",
        }}
      >
        WA
      </div>
    </div>
  );
}

type SplashProps = {
  width: number;
  height: number;
};

/** Splash iOS: tło ink + znak na środku. */
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
