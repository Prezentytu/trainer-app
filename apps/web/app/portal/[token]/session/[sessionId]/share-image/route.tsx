import { ImageResponse } from "next/og";
import {
  SHARE_BG,
  SHARE_FG,
  SHARE_GAIN,
  SHARE_LINE,
  SHARE_MUTED,
  SHARE_PR,
  SHARE_SECONDARY,
  SHARE_SURFACE,
  formatShareDayShort,
  formatShareDuration,
  formatShareKg,
  highlightLifts,
  parseShareVariant,
  pickHeroPr,
  shareCardSize,
  type ShareVariant,
} from "@/lib/shareCard";

export const runtime = "edge";

function resolveShareApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production" && process.env.SKIP_ENV_VALIDATION !== "true") {
    throw new Error("Brak NEXT_PUBLIC_API_URL. Ustaw zmienną w Vercel i przebuduj front.");
  }
  return "http://localhost:5210";
}

type ShareSession = {
  dayLabel: string | null;
  planName: string | null;
  performedOn: string;
  durationSeconds: number | null;
  totalVolumeKg: number;
  totalSets: number;
  clientName?: string | null;
  trainerName?: string | null;
  prs: {
    exerciseId: number;
    exerciseName: string;
    weightKg: number | null;
    reps: number | null;
    estimated1Rm: number | null;
    previousBest1Rm?: number | null;
  }[];
  exercises: {
    exerciseId: number;
    exerciseName: string;
    sets: {
      completed: boolean;
      isPr?: boolean;
      weightKg?: number | null;
      reps?: number | null;
      estimated1Rm?: number | null;
    }[];
  }[];
};

async function loadFonts() {
  const [sansSemi, sansBold, monoBold] = await Promise.all([
    fetch(new URL("../../../../../../assets/fonts/InstrumentSans-SemiBold.ttf", import.meta.url)).then(
      (r) => r.arrayBuffer(),
    ),
    fetch(new URL("../../../../../../assets/fonts/InstrumentSans-Bold.ttf", import.meta.url)).then((r) =>
      r.arrayBuffer(),
    ),
    fetch(new URL("../../../../../../assets/fonts/GeistMono-Bold.ttf", import.meta.url)).then((r) =>
      r.arrayBuffer(),
    ),
  ]);
  return [
    { name: "Instrument Sans", data: sansSemi, style: "normal" as const, weight: 600 as const },
    { name: "Instrument Sans", data: sansBold, style: "normal" as const, weight: 700 as const },
    { name: "Geist Mono", data: monoBold, style: "normal" as const, weight: 700 as const },
  ];
}

function BrandRow({ trainer }: { trainer: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        borderTop: `1px solid ${SHARE_LINE}`,
        paddingTop: 28,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            display: "flex",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: SHARE_FG,
            fontFamily: "Geist Mono",
          }}
        >
          RepMaxer
        </div>
        <div style={{ display: "flex", fontSize: 20, color: SHARE_MUTED, fontFamily: "Instrument Sans" }}>
          z trenerem {trainer}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          width: 56,
          height: 56,
          borderRadius: 28,
          border: `1px solid ${SHARE_LINE}`,
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: SHARE_FG,
          fontFamily: "Geist Mono",
        }}
      >
        RM
      </div>
    </div>
  );
}

function MetaLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 18,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: SHARE_MUTED,
        fontFamily: "Geist Mono",
      }}
    >
      {children}
    </div>
  );
}

/** Stats / Story: hero = objętość (jak dystans w Stravie), potem najlepsze serie — nie lista 0/3. */
function StatsCard({
  session,
  doneSets,
  title,
  subtitle,
  trainer,
  tall,
}: {
  session: ShareSession;
  doneSets: number;
  title: string;
  subtitle: string;
  trainer: string;
  tall: boolean;
}) {
  const prIds = new Set(session.prs.map((p) => p.exerciseId));
  const lifts = highlightLifts(session.exercises, prIds, tall ? 5 : 4);
  const doneExercises = session.exercises.filter((ex) => ex.sets.some((s) => s.completed)).length;
  const volume = Math.round(session.totalVolumeKg);
  const volumeLabel = formatShareKg(volume);
  const pad = tall ? 88 : 64;
  const heroSize = tall ? 160 : 128;
  const prCount = session.prs.length;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: SHARE_BG,
        padding: pad,
        color: SHARE_FG,
        fontFamily: "Instrument Sans",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <MetaLabel>Trening ukończony</MetaLabel>
          {prCount > 0 ? (
            <div
              style={{
                display: "flex",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: SHARE_PR,
                fontFamily: "Geist Mono",
              }}
            >
              PR  {prCount === 1 ? "1 rekord" : `${prCount} rekordy`}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: tall ? 56 : 48,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 22, color: SHARE_SECONDARY }}>{subtitle}</div>
      </div>

      {/* Hero — objętość jako główny flex (jak km w Stravie) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: tall ? 56 : 40,
          marginBottom: tall ? 48 : 36,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: heroSize,
            fontWeight: 700,
            fontFamily: "Geist Mono",
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
          }}
        >
          {volumeLabel}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: SHARE_MUTED,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "Geist Mono",
          }}
        >
          kg objętości
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${SHARE_LINE}`, paddingTop: 28 }}>
        {(
          [
            { value: formatShareDuration(session.durationSeconds), label: "Czas" },
            { value: String(doneSets), label: "Serie" },
            { value: String(doneExercises), label: "Ćwiczenia" },
          ] as const
        ).map((s, i) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flex: 1,
              paddingLeft: i === 0 ? 0 : 28,
              borderLeft: i === 0 ? "none" : `1px solid ${SHARE_LINE}`,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: tall ? 44 : 36,
                fontWeight: 700,
                fontFamily: "Geist Mono",
                letterSpacing: "-0.02em",
              }}
            >
              {s.value}
            </div>
            <MetaLabel>{s.label}</MetaLabel>
          </div>
        ))}
      </div>

      {lifts.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: tall ? 48 : 36,
            background: SHARE_SURFACE,
            borderRadius: 20,
            padding: tall ? "28px 32px" : "24px 28px",
          }}
        >
          <MetaLabel>{prCount > 0 ? "Najlepsze serie" : "Top serie"}</MetaLabel>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 8 }}>
            {lifts.map((lift) => (
              <div
                key={lift.exerciseId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 16,
                  paddingBottom: 16,
                  borderTop: `1px solid ${SHARE_LINE}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    flex: 1,
                    paddingRight: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: tall ? 28 : 26,
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    {lift.name}
                  </div>
                  {lift.isPr ? (
                    <div
                      style={{
                        display: "flex",
                        fontSize: 16,
                        fontWeight: 700,
                        color: SHARE_PR,
                        fontFamily: "Geist Mono",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      PR
                    </div>
                  ) : null}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: tall ? 32 : 28,
                    fontWeight: 700,
                    fontFamily: "Geist Mono",
                    color: lift.isPr ? SHARE_PR : SHARE_FG,
                  }}
                >
                  {lift.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", marginTop: tall ? 48 : 36 }}>
        <BrandRow trainer={trainer} />
      </div>
    </div>
  );
}

function PrCard({
  session,
  title,
  subtitle,
  trainer,
}: {
  session: ShareSession;
  title: string;
  subtitle: string;
  trainer: string;
}) {
  const hero = pickHeroPr(session.prs);
  if (!hero) {
    return (
      <StatsCard
        session={session}
        doneSets={session.exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.completed).length, 0)}
        title={title}
        subtitle={subtitle}
        trainer={trainer}
        tall={false}
      />
    );
  }

  const lift =
    hero.weightKg != null && hero.reps != null
      ? `${formatShareKg(hero.weightKg)}x${hero.reps}`
      : "-";
  const e1 = hero.estimated1Rm != null ? formatShareKg(hero.estimated1Rm) : null;
  const prev = hero.previousBest1Rm != null ? formatShareKg(hero.previousBest1Rm) : null;
  const delta =
    hero.estimated1Rm != null && hero.previousBest1Rm != null
      ? Math.round((hero.estimated1Rm - hero.previousBest1Rm) * 10) / 10
      : null;
  const extraPrs = session.prs.length - 1;
  const doneSets = session.exercises.reduce(
    (a, ex) => a + ex.sets.filter((s) => s.completed).length,
    0,
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: SHARE_BG,
        padding: 64,
        color: SHARE_FG,
        fontFamily: "Instrument Sans",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <MetaLabel>Rekord osobisty</MetaLabel>
        <div style={{ display: "flex", fontSize: 28, color: SHARE_SECONDARY }}>{subtitle}</div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: SHARE_MUTED,
            fontFamily: "Instrument Sans",
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: 20,
          marginTop: 40,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: SHARE_PR,
            fontFamily: "Geist Mono",
          }}
        >
          PR  Nowy rekord
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {hero.exerciseName}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 120,
            fontWeight: 700,
            fontFamily: "Geist Mono",
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
          }}
        >
          {lift}
        </div>
        {e1 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                color: SHARE_SECONDARY,
                fontFamily: "Geist Mono",
              }}
            >
              est. 1RM {e1} kg
              {prev ? ` / poprz. ${prev}` : ""}
            </div>
            {delta != null && delta > 0 ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 32,
                  fontWeight: 700,
                  color: SHARE_GAIN,
                  fontFamily: "Geist Mono",
                }}
              >
                +{formatShareKg(delta)} kg
              </div>
            ) : null}
          </div>
        ) : null}
        {extraPrs > 0 ? (
          <div style={{ display: "flex", fontSize: 22, color: SHARE_MUTED, marginTop: 8 }}>
            +{extraPrs}{" "}
            {extraPrs === 1 ? "inny rekord" : extraPrs < 5 ? "inne rekordy" : "innych rekordów"} w tej
            sesji
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          gap: 0,
          borderTop: `1px solid ${SHARE_LINE}`,
          paddingTop: 28,
          marginBottom: 36,
        }}
      >
        {(
          [
            { value: formatShareDuration(session.durationSeconds), label: "Czas" },
            { value: formatShareKg(Math.round(session.totalVolumeKg)), label: "Objętość" },
            { value: String(doneSets), label: "Serie" },
          ] as const
        ).map((s, i) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              flex: 1,
              paddingLeft: i === 0 ? 0 : 24,
              borderLeft: i === 0 ? "none" : `1px solid ${SHARE_LINE}`,
            }}
          >
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, fontFamily: "Geist Mono" }}>
              {s.value}
            </div>
            <MetaLabel>{s.label === "Objętość" ? "Objętość kg" : s.label}</MetaLabel>
          </div>
        ))}
      </div>

      <BrandRow trainer={trainer} />
    </div>
  );
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ token: string; sessionId: string }> },
) {
  const { token, sessionId } = await ctx.params;
  const url = new URL(req.url);
  const res = await fetch(`${resolveShareApiBase()}/api/portal/${token}/sessions/${sessionId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return new Response("Not found", { status: 404 });
  }
  const session = (await res.json()) as ShareSession;
  const hasPrs = session.prs.length > 0;
  const variant: ShareVariant = parseShareVariant(url.searchParams.get("v"), hasPrs);
  const { width, height } = shareCardSize(variant);

  const doneSets = session.exercises.reduce(
    (a, ex) => a + ex.sets.filter((s) => s.completed).length,
    0,
  );
  const title = session.dayLabel ?? "Trening";
  const subtitle = [formatShareDayShort(session.performedOn), session.planName]
    .filter(Boolean)
    .join(" / ");
  const trainer = session.trainerName?.trim() || "RepMaxer";
  const fonts = await loadFonts();

  const element =
    variant === "pr" ? (
      <PrCard session={session} title={title} subtitle={subtitle} trainer={trainer} />
    ) : (
      <StatsCard
        session={session}
        doneSets={doneSets}
        title={title}
        subtitle={subtitle}
        trainer={trainer}
        tall={variant === "story"}
      />
    );

  return new ImageResponse(element, { width, height, fonts });
}
