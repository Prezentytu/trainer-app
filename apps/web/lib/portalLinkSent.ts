/** Flaga onboardingu „link portalu wysłany” — localStorage + event same-tab. */

export const PORTAL_LINK_SENT_KEY = "wa-portal-link-sent";
export const PORTAL_LINK_SENT_EVENT = "wa-portal-link-sent";

export function markPortalLinkSent(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PORTAL_LINK_SENT_KEY, "1");
    window.dispatchEvent(new Event(PORTAL_LINK_SENT_EVENT));
  } catch {
    /* private mode */
  }
}

export function getPortalLinkSent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PORTAL_LINK_SENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function subscribePortalLinkSent(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(PORTAL_LINK_SENT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PORTAL_LINK_SENT_EVENT, onChange);
  };
}
