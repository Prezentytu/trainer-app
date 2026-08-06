/** Cichy keep-alive audio + Media Session — przerwa widoczna na ekranie blokady iOS. */

export type RestKeepAliveState = {
  endsAt: number;
  totalSeconds: number;
  nextLabel?: string | null;
  setsDone: number;
  setsTotal: number;
};

export type RestKeepAliveHandlers = {
  onSkip?: () => void;
  onExtend?: (deltaSeconds: number) => void;
};

const SILENCE_SRC = "/silence.wav";

let audio: HTMLAudioElement | null = null;
let metaTimer: ReturnType<typeof setInterval> | null = null;
let current: RestKeepAliveState | null = null;
let handlers: RestKeepAliveHandlers = {};

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function leftSeconds(state: RestKeepAliveState): number {
  return Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
}

function ensureAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (audio) return audio;
  const el = document.createElement("audio");
  el.src = SILENCE_SRC;
  el.loop = true;
  el.preload = "auto";
  el.setAttribute("playsinline", "true");
  el.setAttribute("webkit-playsinline", "true");
  // Minimal volume — iOS czasem ignoruje 0, a i tak potrzebujemy aktywnej sesji.
  el.volume = 0.01;
  el.style.display = "none";
  document.body.appendChild(el);
  audio = el;
  return el;
}

function clearMetaTimer() {
  if (metaTimer) {
    clearInterval(metaTimer);
    metaTimer = null;
  }
}

function artwork(): MediaImage[] {
  if (typeof window === "undefined") return [];
  const origin = window.location.origin;
  return [
    { src: `${origin}/icons/192`, sizes: "192x192", type: "image/png" },
    { src: `${origin}/icons/512`, sizes: "512x512", type: "image/png" },
  ];
}

function applyMediaSession(state: RestKeepAliveState) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  const left = leftSeconds(state);
  const next = state.nextLabel?.trim();
  const title = left > 0 ? `Przerwa ${mmss(left)}` : "Koniec przerwy";
  const artist = next ? `Dalej: ${next}` : "RepMaxer";
  const album =
    state.setsTotal > 0
      ? `Seria ${state.setsDone} z ${state.setsTotal}`
      : "Trening";

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork: artwork(),
    });
  } catch {
    /* ignore */
  }

  try {
    const elapsed = Math.min(
      state.totalSeconds,
      Math.max(0, state.totalSeconds - left),
    );
    navigator.mediaSession.setPositionState({
      duration: Math.max(1, state.totalSeconds),
      playbackRate: 1,
      position: elapsed,
    });
  } catch {
    /* setPositionState nie wszędzie */
  }

  try {
    navigator.mediaSession.playbackState = left > 0 ? "playing" : "paused";
  } catch {
    /* ignore */
  }
}

function bindActions() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  const ms = navigator.mediaSession;
  try {
    ms.setActionHandler("pause", () => handlers.onSkip?.());
    ms.setActionHandler("stop", () => handlers.onSkip?.());
    ms.setActionHandler("nexttrack", () => handlers.onExtend?.(15));
    ms.setActionHandler("previoustrack", () => handlers.onExtend?.(-15));
    // play = no-op (keep-alive nie pauzujemy przez play)
    ms.setActionHandler("play", () => {
      void ensureAudio()?.play().catch(() => undefined);
    });
  } catch {
    /* starsze Safari — część handlerów niedostępna */
  }
}

function clearActions() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  const ms = navigator.mediaSession;
  for (const action of ["play", "pause", "stop", "nexttrack", "previoustrack"] as const) {
    try {
      ms.setActionHandler(action, null);
    } catch {
      /* ignore */
    }
  }
  try {
    ms.metadata = null;
    ms.playbackState = "none";
  } catch {
    /* ignore */
  }
}

function startMetaTick() {
  clearMetaTimer();
  metaTimer = setInterval(() => {
    if (!current) return;
    applyMediaSession(current);
  }, 1000);
}

/** Start keep-alive — wołaj w geście użytkownika (✓ serii). */
export function start(state: RestKeepAliveState, nextHandlers: RestKeepAliveHandlers = {}) {
  if (typeof window === "undefined") return;
  handlers = nextHandlers;
  current = state;
  const el = ensureAudio();
  if (el) {
    try {
      el.currentTime = 0;
      void el.play().catch(() => {
        /* autoplay zablokowany — bez keep-alive, timer i tak działa na foreground */
      });
    } catch {
      /* ignore */
    }
  }
  bindActions();
  applyMediaSession(state);
  startMetaTick();
}

export function update(state: RestKeepAliveState) {
  if (!current) return;
  current = state;
  applyMediaSession(state);
}

export function stop() {
  clearMetaTimer();
  current = null;
  handlers = {};
  if (audio) {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      /* ignore */
    }
  }
  clearActions();
}

export function isActive(): boolean {
  return current != null;
}
