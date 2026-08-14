/** Wspólny znak R do ImageResponse (ikony / splash) — hexy OK poza CSS tokenami. */

export const BRAND_BG = "#0B0C0D";
export const BRAND_ACCENT = "#FFFFFF";
export const BRAND_FG = "#FFFFFF";

/**
 * Instrument Sans SemiBold „R” w viewBox 0 0 32 32.
 * Obrys z TTF — favicon SVG nie może zależeć od webfontu.
 */
export const BRAND_MARK_PATH =
  "M7.597 26.38V5.26H16.515Q18.773 5.26 20.445 6.023Q22.117 6.785 23.012 8.164Q23.907 9.543 23.907 11.391Q23.907 13.209 23.012 14.588Q22.117 15.967 20.445 16.729Q18.773 17.492 16.515 17.492H10.589V14.588H16.397Q18.245 14.588 19.228 13.737Q20.211 12.887 20.211 11.391Q20.211 9.895 19.243 9.088Q18.275 8.281 16.397 8.281H11.411V26.38ZM19.683 26.38 10.267 15.585H14.549L24.963 26.38Z";

export const BRAND_MARK_VIEWBOX = 32;

type BrandMarkProps = {
  /** Rozmiar canvasu (kwadrat). */
  size: number;
  /** Maskable: ~20% marginesu bezpieczeństwa wokół znaku. */
  maskable?: boolean;
};

/** Kwadratowa ikona: tło near-black + biały znak R. */
export function BrandMarkIcon({ size, maskable = false }: BrandMarkProps) {
  const pad = maskable ? size * 0.2 : 0;
  const inner = size - pad * 2;

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
      <svg
        width={inner}
        height={inner}
        viewBox={`0 0 ${BRAND_MARK_VIEWBOX} ${BRAND_MARK_VIEWBOX}`}
        fill={BRAND_FG}
      >
        <path d={BRAND_MARK_PATH} />
      </svg>
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
