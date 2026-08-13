/** Alarm końca przerwy — WebAudio (zero plików) + wibracja. */

let ctx: AudioContext | null = null;

type AudioSessionType =
  | "auto"
  | "playback"
  | "transient"
  | "transient-solo"
  | "ambient"
  | "play-and-record";

function audioSession(): { type: string } | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
}

/**
 * Safari 16.4+: `ambient` miksuje się z muzyką zamiast ją pauzować.
 * Keep-alive na Lock Screen przełącza na `playback` (restKeepAlive).
 */
export function setAudioSessionType(type: AudioSessionType): void {
  try {
    const session = audioSession();
    if (session) session.type = type;
  } catch {
    /* ignore */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    setAudioSessionType("ambient");
    ctx = new AC();
  }
  return ctx;
}

/** Krótka haptyka przy zaliczeniu serii (guard na wsparcie API). */
export function lightHaptic(): void {
  try {
    navigator.vibrate?.(10);
  } catch {
    /* ignore */
  }
}

/** Wywołaj w handlerze gestu użytkownika (start przerwy) — odblokowuje audio na iOS. */
export function unlockAudio(): void {
  setAudioSessionType("ambient");
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") {
    void c.resume();
  }
  // Cichy buffer — „odblokowanie” kontekstu po gestie.
  try {
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
  } catch {
    /* ignore */
  }
}

function beep(c: AudioContext, when: number, freq: number, dur: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.35, when + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

/** Trzy krótkie beepy + wibracja. */
export function playRestEndAlarm(): void {
  setAudioSessionType("ambient");
  const c = getCtx();
  if (c) {
    void c.resume().then(() => {
      const t0 = c.currentTime + 0.02;
      beep(c, t0, 880, 0.12);
      beep(c, t0 + 0.18, 880, 0.12);
      beep(c, t0 + 0.36, 660, 0.22);
    });
  }
  try {
    navigator.vibrate?.([200, 100, 200, 100, 400]);
  } catch {
    /* ignore */
  }
}

/**
 * Lokalne powiadomienie końca przerwy (gdy karta w tle).
 * Wymaga wcześniej przyznanego Notification.permission (push w profilu).
 */
export async function notifyRestEnd(opts?: {
  nextLabel?: string | null;
  url?: string;
}): Promise<void> {
  if (typeof window === "undefined") return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  // Na foreground wystarczy alarm dźwiękowy — nie spamuj.
  if (document.visibilityState === "visible") return;

  const body = opts?.nextLabel?.trim()
    ? `Dalej: ${opts.nextLabel.trim()}`
    : "Czas na następną serię.";
  const url = opts?.url ?? window.location.href;

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("Koniec przerwy", {
        body,
        tag: "wa-rest-end",
        data: { url },
      });
      return;
    }
  } catch {
    /* fall through */
  }

  try {
    new Notification("Koniec przerwy", { body, tag: "wa-rest-end" });
  } catch {
    /* ignore */
  }
}
