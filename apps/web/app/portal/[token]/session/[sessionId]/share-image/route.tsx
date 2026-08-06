import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1080, height: 1350 };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5210";

type ShareSession = {
  dayLabel: string | null;
  planName: string | null;
  performedOn: string;
  durationSeconds: number | null;
  totalVolumeKg: number;
  totalSets: number;
  clientName?: string | null;
  trainerName?: string | null;
  prs: { exerciseId: number; exerciseName: string }[];
  exercises: { sets: { completed: boolean }[] }[];
};

function formatDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

function formatDuration(seconds: number | null): string {
  const sec = seconds ?? 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string; sessionId: string }> },
) {
  const { token, sessionId } = await ctx.params;
  const res = await fetch(`${API}/api/portal/${token}/sessions/${sessionId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return new Response("Not found", { status: 404 });
  }
  const session = (await res.json()) as ShareSession;
  const doneSets = session.exercises.reduce(
    (a, ex) => a + ex.sets.filter((s) => s.completed).length,
    0,
  );
  const volume = Math.round(session.totalVolumeKg).toLocaleString("pl-PL");
  const title = session.dayLabel ?? "Trening";
  const subtitle = [formatDay(session.performedOn), session.planName].filter(Boolean).join(" · ");
  const trainer = session.trainerName?.trim() || "RepMaxer";
  const prCount = session.prs.length;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B0C0D",
          padding: 72,
          fontFamily: "system-ui, sans-serif",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#9AA1A8",
            }}
          >
            RepMaxer
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ fontSize: 24, color: "#C9CED4" }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <div style={{ fontSize: 48, fontWeight: 700 }}>{formatDuration(session.durationSeconds)}</div>
            <div style={{ fontSize: 18, color: "#9AA1A8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Czas
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <div style={{ fontSize: 48, fontWeight: 700 }}>{volume}</div>
            <div style={{ fontSize: 18, color: "#9AA1A8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              kg
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <div style={{ fontSize: 48, fontWeight: 700 }}>{doneSets}</div>
            <div style={{ fontSize: 18, color: "#9AA1A8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Serie
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {prCount > 0 ? (
            <div style={{ fontSize: 28, fontWeight: 600, color: "#D4AF37" }}>
              ★ {prCount === 1 ? "Rekord osobisty" : `${prCount} rekordy`}
            </div>
          ) : (
            <div style={{ fontSize: 28, color: "#C9CED4" }}>Trening zaliczony</div>
          )}
          <div style={{ fontSize: 22, color: "#9AA1A8" }}>
            {session.clientName ? `${session.clientName} · ` : ""}
            z trenerem {trainer}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
