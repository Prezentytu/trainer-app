"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, isAbortError } from "@/lib/api";
import { fileToHistoryImage, HISTORY_IMPORT_MAX_IMAGES } from "@/lib/compressImage";
import {
  historyImportFailMessage,
  historyImportTimeoutMessage,
  historyImportTimeoutMs,
  historyImportWaitCopy,
  HistoryImportWaitPhase,
} from "@/lib/historyImportWait";
import { Button, ErrorBanner, Field, inputClass } from "@/components/ui";
import { ImportWaitStatus } from "@/components/ImportWaitStatus";
import { Icon } from "@/components/Icon";

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Nie udało się odczytać pliku."));
    reader.readAsText(file);
  });
}

export default function PortalHistoryImportPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [parsePhase, setParsePhase] = useState<HistoryImportWaitPhase | null>(null);
  const [compressDone, setCompressDone] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const cancelReasonRef = useRef<"user" | "timeout" | null>(null);

  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [busy]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleFiles = (list: FileList | null) => {
    if (busy) return;
    if (!list?.length) return;
    const incoming = [...list];
    const csv = incoming.find((f) => f.name.toLowerCase().endsWith(".csv"));
    if (csv) {
      void readTextFile(csv)
        .then((t) => {
          setText(t);
          setError(null);
        })
        .catch((e: Error) => setError(e.message));
      return;
    }
    const imgs = incoming.filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...imgs].slice(0, HISTORY_IMPORT_MAX_IMAGES));
    setError(null);
  };

  const submit = async () => {
    if (busy) return;
    cancelReasonRef.current = null;
    const controller = new AbortController();
    abortRef.current = controller;
    const imageCount = Math.min(files.length, HISTORY_IMPORT_MAX_IMAGES);
    const timeoutId = window.setTimeout(() => {
      cancelReasonRef.current = "timeout";
      controller.abort();
    }, historyImportTimeoutMs(imageCount));

    setBusy(true);
    setError(null);
    setElapsedSec(0);
    setCompressDone(0);
    setParsePhase(imageCount > 0 ? "compress" : "read");
    try {
      const images = [];
      const slice = files.slice(0, HISTORY_IMPORT_MAX_IMAGES);
      for (let i = 0; i < slice.length; i++) {
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        images.push(await fileToHistoryImage(slice[i]));
        setCompressDone(i + 1);
      }
      setParsePhase("read");
      await api.portal.importHistory(
        token,
        {
          text: text.trim() || undefined,
          images: images.length ? images : undefined,
        },
        { signal: controller.signal },
      );
      setSent(true);
    } catch (e) {
      if (isAbortError(e)) {
        if (cancelReasonRef.current === "timeout") {
          setError(historyImportTimeoutMessage(imageCount));
        }
        return;
      }
      setError(historyImportFailMessage(e, imageCount));
    } finally {
      window.clearTimeout(timeoutId);
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
      setParsePhase(null);
    }
  };

  const cancelSubmit = () => {
    cancelReasonRef.current = "user";
    abortRef.current?.abort();
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-lg space-y-8 pb-24">
        <header>
          <p className="t-label text-muted">Historia</p>
          <h1 className="t-title mt-2">Wysłane do trenera</h1>
          <p className="t-small mt-2 max-w-[48ch]">
            Trener zobaczy treningi u siebie i zatwierdzi, zanim cokolwiek trafi do Twojej historii.
          </p>
        </header>
        <Button onClick={() => (window.location.href = `/portal/${token}`)}>Wróć do treningów</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-24">
      <header>
        <Link
          href={`/portal/${token}/history`}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-[color,transform] duration-[var(--dur-fast)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.97]"
        >
          <Icon name="caret-left" size={16} decorative />
          Historia
        </Link>
        <p className="t-label mt-2 text-muted">Poprzednia apka</p>
        <h1 className="t-title mt-2">Wrzuć zdjęcia treningów</h1>
        <p className="t-small mt-2 max-w-[48ch]">
          Zdjęcia z poprzedniej apki albo plik CSV, jeśli dziennik daje eksport. Trener zobaczy je u
          siebie. Nic nie zapisuje się od razu w historii.
        </p>
      </header>

      <ErrorBanner message={error} />

      <div className="grid gap-5">
        <Field label="Screeny albo CSV">
          <input
            className={inputClass}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.csv"
            multiple
            disabled={busy}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {files.length > 0 ? (
            <p className="mt-1.5 text-sm text-muted">
              {files.length} {files.length === 1 ? "zdjęcie" : files.length < 5 ? "zdjęcia" : "zdjęć"}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-muted">Max {HISTORY_IMPORT_MAX_IMAGES} zdjęć.</p>
          )}
        </Field>
        <Field label="Albo wklej tekst treningu">
          <textarea
            className={`${inputClass} min-h-36 font-mono text-sm`}
            value={text}
            disabled={busy}
            onChange={(e) => setText(e.target.value)}
            placeholder="8 x 30kg, 8 x 35kg, 8 x 40kg"
          />
        </Field>
        {busy && parsePhase ? (
          <ImportWaitStatus
            {...historyImportWaitCopy({
              phase: parsePhase,
              imageCount: files.length,
              compressDone,
              elapsedSec,
            })}
            elapsedSec={elapsedSec}
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => void submit()}
            disabled={busy || (files.length === 0 && text.trim().length < 10)}
            loading={busy}
          >
            {busy ? "Wysyłam…" : "Wyślij do trenera"}
          </Button>
          {busy ? (
            <Button variant="ghost" onClick={cancelSubmit}>
              Przerwij
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
