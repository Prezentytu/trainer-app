import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type FinalizeFn = (params?: {
  navigate?: (params: {
    session: { currentTask?: unknown } | null | undefined;
    decorateUrl: (url: string) => string;
  }) => void | Promise<unknown>;
}) => Promise<{ error: unknown }>;

/** Domknięcie sesji Clerk Future + nawigacja na `/`. */
export async function finalizeAndRedirect(
  finalize: FinalizeFn,
  router: AppRouterInstance,
): Promise<{ error: unknown }> {
  return finalize({
    navigate: async ({ session, decorateUrl }) => {
      if (session?.currentTask) return;
      const url = decorateUrl("/");
      if (url.startsWith("http")) {
        window.location.href = url;
      } else {
        router.push(url);
      }
    },
  });
}
