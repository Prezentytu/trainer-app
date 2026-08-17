/** Edge-safe: zły / ucięty pk_* nie może odpalać clerkMiddleware (500 na każdym requestcie). */
export function isClerkPublishableKey(value: string | undefined): boolean {
  const key = value?.trim() ?? "";
  return /^pk_(test|live)_[A-Za-z0-9+/=_-]{20,}$/.test(key);
}
