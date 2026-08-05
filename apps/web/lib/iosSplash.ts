/**
 * Lista apple-touch-startup-image dla obecnych iPhone'ów (portrait).
 * Media queries wg Apple HIG / device-width × device-height × device-pixel-ratio.
 */

export type IosSplashEntry = {
  /** np. "1170x2532" — klucz route `/splash/[size]` */
  size: string;
  width: number;
  height: number;
  media: string;
};

export const IOS_SPLASH_ENTRIES: IosSplashEntry[] = [
  // iPhone 15 Pro Max / 14 Pro Max
  {
    size: "1290x2796",
    width: 1290,
    height: 2796,
    media:
      "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  // iPhone 15 Pro / 14 Pro
  {
    size: "1179x2556",
    width: 1179,
    height: 2556,
    media:
      "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  // iPhone 14 Plus / 13 Pro Max / 12 Pro Max
  {
    size: "1284x2778",
    width: 1284,
    height: 2778,
    media:
      "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  // iPhone 14 / 13 / 13 Pro / 12 / 12 Pro
  {
    size: "1170x2532",
    width: 1170,
    height: 2532,
    media:
      "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  // iPhone 13 mini / 12 mini
  {
    size: "1080x2340",
    width: 1080,
    height: 2340,
    media:
      "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  // iPhone 11 Pro Max / XS Max
  {
    size: "1242x2688",
    width: 1242,
    height: 2688,
    media:
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  // iPhone 11 / XR
  {
    size: "828x1792",
    width: 828,
    height: 1792,
    media:
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  // iPhone 11 Pro / X / XS
  {
    size: "1125x2436",
    width: 1125,
    height: 2436,
    media:
      "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  // iPhone 8 Plus
  {
    size: "1242x2208",
    width: 1242,
    height: 2208,
    media:
      "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  // iPhone SE (3rd) / 8 / 7
  {
    size: "750x1334",
    width: 750,
    height: 1334,
    media:
      "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
];

export function parseSplashSize(raw: string): { width: number; height: number } | null {
  const match = /^(\d+)x(\d+)$/.exec(raw);
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return null;
  }
  const allowed = IOS_SPLASH_ENTRIES.some((e) => e.size === raw);
  return allowed ? { width, height } : null;
}
