/** Kanoniczny host indeksowany przez Google. Wszystko inne (dev, preview, localhost) = noindex. */
export function isPublicMarketingHost(
  siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): boolean {
  if (!siteUrl) return false;
  try {
    const host = new URL(siteUrl).hostname.replace(/^www\./, "");
    return host === "repmaxer.pl";
  } catch {
    return false;
  }
}
