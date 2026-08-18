"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function FormCheckPlayer({
  sessionId,
  exerciseId,
  contentType,
  portalToken,
}: {
  sessionId: number;
  exerciseId: number;
  contentType: string;
  portalToken?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    const load = portalToken
      ? api.portal.formCheckBlob(portalToken, sessionId, exerciseId)
      : api.sessions.formCheckBlob(sessionId, exerciseId);
    load
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sessionId, exerciseId, portalToken]);

  if (error) return <p className="mt-2 text-sm text-muted">{error}</p>;
  if (!url) return <p className="mt-2 text-sm text-muted">Wczytuję nagranie…</p>;

  if (contentType.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Nagranie techniki"
        className="mt-2 max-h-64 w-full rounded-lg border border-border object-contain"
      />
    );
  }

  return (
    <video
      src={url}
      controls
      playsInline
      className="mt-2 max-h-64 w-full rounded-lg border border-border"
    />
  );
}
