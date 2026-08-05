import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Next.js 16: `proxy.ts` zamiast `middleware.ts`.
 * Auth checks są w zasobach (layout/page + auth.protect) — nie w createRouteMatcher.
 * clerkMiddleware() zostaje: sesja / cookie Clerka.
 */
export default clerkEnabled
  ? clerkMiddleware()
  : function proxy(_req: NextRequest) {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
