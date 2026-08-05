"use client";

import { Button } from "@/components/ui";

export function OfflineRetryButton() {
  return (
    <Button full className="mt-8 max-w-xs" onClick={() => window.location.reload()}>
      Spróbuj ponownie
    </Button>
  );
}
