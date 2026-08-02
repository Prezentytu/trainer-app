/** Alarm końca przerwy — WebAudio (zero plików) + wibracja. */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Wywołaj w handlerze gestu użytkownika (np. ✓ serii) — odblokowuje audio na iOS. */
export function unlockAudio(): void {
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
