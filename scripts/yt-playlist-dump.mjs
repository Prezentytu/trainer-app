#!/usr/bin/env node
/**
 * Zrzuca playlistę YouTube do JSON (bez klucza API).
 * Użycie: node scripts/yt-playlist-dump.mjs PLmhudurbOPnfRM76zhvTdN9MgeDwWnYUf
 * Wynik: .ai/data/yt/{playlistId}.json
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function parseDuration(text) {
  if (!text || !/^\d+:\d{1,2}(:\d{2})?$/.test(text)) return null;
  const parts = text.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function walk(node, visitors) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visitors);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (visitors[key]) visitors[key](value);
    walk(value, visitors);
  }
}

function extractVideos(data) {
  const videos = [];
  walk(data, {
    lockupViewModel(vm) {
      const youtubeId = vm.contentId;
      if (!youtubeId) return;
      const title =
        vm.metadata?.lockupMetadataViewModel?.title?.content ?? null;
      let durationText = null;
      for (const ov of vm.contentImage?.thumbnailViewModel?.overlays ?? []) {
        for (const badge of ov.thumbnailBottomOverlayViewModel?.badges ?? []) {
          const t = badge.thumbnailBadgeViewModel?.text;
          if (t && /^\d+:\d{1,2}(:\d{2})?$/.test(t)) durationText = t;
        }
      }
      videos.push({
        youtubeId,
        title,
        durationText,
        seconds: parseDuration(durationText),
      });
    },
  });
  return videos;
}

function findContinuations(data) {
  const tokens = [];
  walk(data, {
    continuationCommand(cmd) {
      if (cmd.token) tokens.push(cmd.token);
    },
  });
  // Dłuższy token playlisty zwykle daje kolejne filmy; krótki bywa pusty.
  return [...new Set(tokens)].sort((a, b) => b.length - a.length);
}

async function fetchPlaylistPage(playlistId) {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "pl-PL,pl;q=0.9" },
  });
  if (!res.ok) throw new Error(`Playlist HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) throw new Error("Brak ytInitialData w HTML playlisty");
  const data = JSON.parse(m[1]);
  const key = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const ver = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1];
  if (!key || !ver) throw new Error("Brak klucza Innertube w HTML");
  const title =
    html.match(/<title>(.*?)<\/title>/)?.[1]?.replace(" - YouTube", "") ??
    playlistId;
  return { data, key, ver, title };
}

async function fetchContinuation(token, key, ver) {
  const body = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: ver,
        hl: "pl",
        gl: "PL",
      },
    },
    continuation: token,
  };
  const res = await fetch(
    `https://www.youtube.com/youtubei/v1/browse?key=${key}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": UA,
        "X-Youtube-Client-Name": "1",
        "X-Youtube-Client-Version": ver,
        Origin: "https://www.youtube.com",
        Referer: "https://www.youtube.com/",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`Continuation HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const playlistId = process.argv[2];
  if (!playlistId) {
    console.error("Użycie: node scripts/yt-playlist-dump.mjs <playlistId>");
    process.exit(1);
  }

  const { data, key, ver, title } = await fetchPlaylistPage(playlistId);
  const seen = new Set();
  const videos = [];

  const pushAll = (chunk) => {
    for (const v of chunk) {
      if (!v.youtubeId || seen.has(v.youtubeId)) continue;
      seen.add(v.youtubeId);
      videos.push(v);
    }
  };

  pushAll(extractVideos(data));
  const queue = findContinuations(data);
  const tried = new Set();
  let pages = 0;
  while (queue.length && pages < 10) {
    const token = queue.shift();
    if (!token || tried.has(token)) continue;
    tried.add(token);
    const next = await fetchContinuation(token, key, ver);
    const chunk = extractVideos(next);
    pushAll(chunk);
    for (const t of findContinuations(next)) {
      if (!tried.has(t)) queue.push(t);
    }
    pages += 1;
    if (chunk.length === 0) continue;
  }

  const out = {
    playlistId,
    title,
    url: `https://www.youtube.com/playlist?list=${playlistId}`,
    dumpedAt: new Date().toISOString(),
    count: videos.length,
    videos: videos.map((v, i) => ({ position: i + 1, ...v })),
  };

  const outPath = join(ROOT, ".ai", "data", "yt", `${playlistId}.json`);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Zapisano ${videos.length} filmów → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
