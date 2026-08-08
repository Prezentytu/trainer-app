/** Detekcja środowiska instalacji PWA — czysta funkcja, zero React. */

export type InstallPlatform = "ios" | "android" | "desktop";

export type InstallBrowser =
  | "safari"
  | "chrome"
  | "firefox"
  | "edge"
  | "opera"
  | "samsung"
  | "unknown";

export type InstallInApp =
  | "messenger"
  | "facebook"
  | "instagram"
  | "threads"
  | "tiktok"
  | "snapchat"
  | "linkedin"
  | "twitter"
  | "line"
  | "telegram"
  | "generic"
  | null;

export type InstallCapability =
  | "installed"
  | "native-prompt"
  | "manual"
  | "escape-required";

export type InstallEnv = {
  platform: InstallPlatform;
  browser: InstallBrowser;
  inApp: InstallInApp;
  iosVersion: number | null;
  capability: InstallCapability;
  escapeUrl: string | null;
};

export type InstallStep = {
  icon: "share" | "more" | "plus" | "download" | "warning";
  text: string;
};

export type InstallGuide = {
  title: string;
  description: string;
  steps: InstallStep[];
  /** Główny CTA w Sheet — escape do przeglądarki. */
  escapeLabel: string | null;
  showCopyLink: boolean;
};

type DetectOptions = {
  userAgent?: string;
  href?: string;
  standalone?: boolean;
  /** Gdy true — Chrome/Edge na Androidzie może dostać native-prompt (ustawia hook). */
  hasNativePrompt?: boolean;
};

function readStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}

const IOS_MIN_THIRD_PARTY = 16.4;

function parseIosVersion(ua: string): number | null {
  const match = ua.match(/OS (\d+)[_.](\d+)/);
  if (!match) return null;
  return Number(`${match[1]}.${match[2]}`);
}

function detectPlatform(ua: string): InstallPlatform {
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  // iPadOS 13+ jako MacIntel — sprawdzane osobno w detectInstallEnv przy maxTouchPoints
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function detectInApp(ua: string): InstallInApp {
  if (/Messenger|FB_IAB.*Messenger/i.test(ua) || /\[FBAN\/Messenger/i.test(ua)) {
    return "messenger";
  }
  if (/FBAN|FBAV|FB_IAB|FB4A/i.test(ua)) return "facebook";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/Threads/i.test(ua)) return "threads";
  if (/TikTok|musical_ly|Bytedance/i.test(ua)) return "tiktok";
  if (/Snapchat/i.test(ua)) return "snapchat";
  if (/LinkedInApp/i.test(ua)) return "linkedin";
  if (/Twitter|X\/\d/i.test(ua)) return "twitter";
  if (/Line\//i.test(ua)) return "line";
  if (/Telegram/i.test(ua)) return "telegram";
  return null;
}

function detectBrowser(ua: string, platform: InstallPlatform): InstallBrowser {
  if (platform === "ios") {
    if (/CriOS/i.test(ua)) return "chrome";
    if (/FxiOS/i.test(ua)) return "firefox";
    if (/EdgiOS/i.test(ua)) return "edge";
    if (/OPiOS|OPT\//i.test(ua)) return "opera";
    // Safari ma "Safari/" i nie ma tokenów third-party
    if (/Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua)) {
      return "safari";
    }
    return "unknown";
  }

  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/Edg\//i.test(ua)) return "edge";
  if (/OPR\/|Opera/i.test(ua)) return "opera";
  if (/Firefox|FxiOS/i.test(ua)) return "firefox";
  if (/Chrome|CriOS/i.test(ua)) return "chrome";
  if (/Safari/i.test(ua)) return "safari";
  return "unknown";
}

function isGenericWebView(ua: string, platform: InstallPlatform, browser: InstallBrowser): boolean {
  if (platform === "android" && /; wv\)/i.test(ua)) return true;
  if (platform === "ios") {
    // WKWebView bez Safari/ i bez znanych przeglądarek third-party
    const hasSafariToken = /Safari\//i.test(ua);
    const isKnownBrowser =
      browser !== "unknown" || /CriOS|FxiOS|EdgiOS|OPiOS|OPT\//i.test(ua);
    if (!hasSafariToken && !isKnownBrowser) return true;
  }
  return false;
}

/** Buduje deep link otwierający URL w prawdziwej przeglądarce. */
export function buildEscapeUrl(
  pageUrl: string,
  platform: InstallPlatform,
  inApp: InstallInApp,
): string | null {
  if (platform === "desktop") return null;

  try {
    const url = new URL(pageUrl);
    if (inApp === "line") {
      url.searchParams.set("openExternalBrowser", "1");
      return url.toString();
    }

    const href = url.toString();
    const enc = encodeURIComponent(href);

    if (platform === "ios") {
      if (inApp === "instagram" || inApp === "threads") {
        return `instagram://extbrowser/?url=${enc}`;
      }
      // x-safari-https://example.com/path — bez drugiego ://
      return `x-safari-${href}`;
    }

    // Android intent — bez package=, żeby nie padać bez Chrome
    return (
      `intent://${url.host}${url.pathname}${url.search}` +
      `#Intent;scheme=https;action=android.intent.action.VIEW;` +
      `category=android.intent.category.BROWSABLE;` +
      `S.browser_fallback_url=${enc};end`
    );
  } catch {
    return null;
  }
}

/**
 * Override do ręcznych testów bez farmy telefonów:
 * `?installEnv=ios-safari` | `ios-chrome` | `android-chrome` | `messenger-ios` | …
 */
export function parseInstallEnvOverride(search: string): Partial<DetectOptions> & {
  force?: Partial<InstallEnv>;
} | null {
  if (typeof URLSearchParams === "undefined") return null;
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const raw = params.get("installEnv");
  if (!raw) return null;

  const presets: Record<string, Partial<InstallEnv>> = {
    "ios-safari": {
      platform: "ios",
      browser: "safari",
      inApp: null,
      iosVersion: 17.0,
      capability: "manual",
    },
    "ios-chrome": {
      platform: "ios",
      browser: "chrome",
      inApp: null,
      iosVersion: 17.0,
      capability: "manual",
    },
    "ios-firefox": {
      platform: "ios",
      browser: "firefox",
      inApp: null,
      iosVersion: 17.0,
      capability: "manual",
    },
    "ios-old": {
      platform: "ios",
      browser: "chrome",
      inApp: null,
      iosVersion: 16.0,
      capability: "escape-required",
    },
    "android-chrome": {
      platform: "android",
      browser: "chrome",
      inApp: null,
      iosVersion: null,
      capability: "manual",
    },
    "android-samsung": {
      platform: "android",
      browser: "samsung",
      inApp: null,
      iosVersion: null,
      capability: "manual",
    },
    "android-firefox": {
      platform: "android",
      browser: "firefox",
      inApp: null,
      iosVersion: null,
      capability: "manual",
    },
    "messenger-ios": {
      platform: "ios",
      browser: "unknown",
      inApp: "messenger",
      iosVersion: 17.0,
      capability: "escape-required",
    },
    "messenger-android": {
      platform: "android",
      browser: "unknown",
      inApp: "messenger",
      iosVersion: null,
      capability: "escape-required",
    },
    "instagram-ios": {
      platform: "ios",
      browser: "unknown",
      inApp: "instagram",
      iosVersion: 17.0,
      capability: "escape-required",
    },
    standalone: {
      platform: "ios",
      browser: "safari",
      inApp: null,
      iosVersion: 17.0,
      capability: "installed",
    },
  };

  const force = presets[raw];
  return force ? { force } : null;
}

export function detectInstallEnv(options: DetectOptions = {}): InstallEnv {
  const ua =
    options.userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  const href =
    options.href ?? (typeof location !== "undefined" ? location.href : "https://localhost/");
  const standalone =
    options.standalone ?? (typeof window !== "undefined" ? readStandalone() : false);

  // Override z query — po detekcji bazowej nadpisujemy pola
  let override: Partial<InstallEnv> | undefined;
  if (typeof location !== "undefined" || options.href) {
    const search =
      options.href != null
        ? (() => {
            try {
              return new URL(options.href).search;
            } catch {
              return "";
            }
          })()
        : typeof location !== "undefined"
          ? location.search
          : "";
    override = parseInstallEnvOverride(search)?.force;
  }

  if (standalone || override?.capability === "installed") {
    const base: InstallEnv = {
      platform: override?.platform ?? detectPlatform(ua),
      browser: override?.browser ?? "safari",
      inApp: null,
      iosVersion: override?.iosVersion ?? parseIosVersion(ua),
      capability: "installed",
      escapeUrl: null,
    };
    return { ...base, ...override, capability: "installed", escapeUrl: null, inApp: null };
  }

  let platform = detectPlatform(ua);
  if (
    platform === "desktop" &&
    typeof navigator !== "undefined" &&
    navigator.platform === "MacIntel" &&
    navigator.maxTouchPoints > 1
  ) {
    platform = "ios";
  }

  let inApp = detectInApp(ua);
  let browser = detectBrowser(ua, platform);
  const iosVersion = platform === "ios" ? parseIosVersion(ua) : null;

  if (!inApp && isGenericWebView(ua, platform, browser)) {
    inApp = "generic";
  }

  let capability: InstallCapability = "manual";

  if (inApp) {
    capability = "escape-required";
  } else if (
    platform === "ios" &&
    browser !== "safari" &&
    browser !== "unknown" &&
    iosVersion != null &&
    iosVersion < IOS_MIN_THIRD_PARTY
  ) {
    // Third-party przed 16.4 — tylko Safari instaluje
    capability = "escape-required";
  } else if (options.hasNativePrompt && platform !== "ios") {
    capability = "native-prompt";
  }

  let cleanHref = href;
  try {
    const u = new URL(href);
    u.searchParams.delete("installEnv");
    cleanHref = u.toString();
  } catch {
    /* keep */
  }

  const env: InstallEnv = {
    platform,
    browser,
    inApp,
    iosVersion,
    capability,
    escapeUrl:
      capability === "escape-required"
        ? buildEscapeUrl(cleanHref, platform, inApp)
        : null,
  };

  if (override) {
    const mergedPlatform = override.platform ?? platform;
    const mergedInApp = override.inApp !== undefined ? override.inApp : inApp;
    let mergedCapability = override.capability ?? capability;
    if (
      options.hasNativePrompt &&
      mergedCapability === "manual" &&
      mergedPlatform !== "ios" &&
      !mergedInApp
    ) {
      mergedCapability = "native-prompt";
    }
    return {
      ...env,
      ...override,
      capability: mergedCapability,
      escapeUrl:
        mergedCapability === "escape-required"
          ? buildEscapeUrl(cleanHref, mergedPlatform, mergedInApp)
          : null,
    };
  }

  return env;
}

function inAppLabel(inApp: InstallInApp): string {
  switch (inApp) {
    case "messenger":
      return "Messengerze";
    case "facebook":
      return "Facebooku";
    case "instagram":
      return "Instagramie";
    case "threads":
      return "Threads";
    case "tiktok":
      return "TikToku";
    case "snapchat":
      return "Snapchacie";
    case "linkedin":
      return "LinkedIn";
    case "twitter":
      return "X";
    case "line":
      return "LINE";
    case "telegram":
      return "Telegramie";
    default:
      return "tej aplikacji";
  }
}

/** Kroki instalacji / escape po polsku — dopasowane do env. */
export function installGuide(env: InstallEnv): InstallGuide {
  if (env.capability === "installed") {
    return {
      title: "Aplikacja zainstalowana",
      description: "Otwierasz plan z ikony na ekranie głównym.",
      steps: [],
      escapeLabel: null,
      showCopyLink: false,
    };
  }

  if (env.capability === "escape-required") {
    const where = inAppLabel(env.inApp);
    const openLabel =
      env.platform === "ios" ? "Otwórz w Safari" : "Otwórz w przeglądarce";
    return {
      title: "Otwórz w przeglądarce",
      description: `W ${where} nie da się dodać aplikacji do ekranu — trening i powiadomienia działają dopiero w Safari lub Chrome.`,
      steps: [
        {
          icon: "more",
          text:
            env.platform === "ios"
              ? "Dotknij ••• (menu) w prawym górnym rogu, potem „Otwórz w Safari”."
              : "Dotknij ••• (menu), potem „Otwórz w przeglądarce” / Chrome.",
        },
        {
          icon: "share",
          text: "Albo użyj przycisku poniżej — spróbujemy otworzyć właściwą przeglądarkę.",
        },
        {
          icon: "plus",
          text:
            env.platform === "ios"
              ? "W Safari: Udostępnij → „Dodaj do ekranu początkowego”."
              : "W Chrome: menu ⋮ → „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”.",
        },
      ],
      escapeLabel: openLabel,
      showCopyLink: true,
    };
  }

  if (env.platform === "ios") {
    if (env.browser === "safari") {
      return {
        title: "Dodaj do ekranu głównego",
        description: "Otwieraj plan jak aplikację — z ikony, bez szukania linku.",
        steps: [
          {
            icon: "share",
            text: "Dotknij ikonę Udostępnij na dole Safari (kwadrat ze strzałką w górę).",
          },
          {
            icon: "plus",
            text: "Przewiń i wybierz „Dodaj do ekranu początkowego”, potem „Dodaj”.",
          },
        ],
        escapeLabel: null,
        showCopyLink: false,
      };
    }

    const browserName =
      env.browser === "chrome"
        ? "Chrome"
        : env.browser === "firefox"
          ? "Firefox"
          : env.browser === "edge"
            ? "Edge"
            : "przeglądarce";

    return {
      title: "Dodaj do ekranu głównego",
      description: `W ${browserName} na iPhonie instalacja jest w menu Udostępnij (pasek adresu).`,
      steps: [
        {
          icon: "share",
          text: `Dotknij Udostępnij w pasku adresu ${browserName} (nie na dole ekranu).`,
        },
        {
          icon: "plus",
          text: "Wybierz „Dodaj do ekranu początkowego”, potem „Dodaj”.",
        },
      ],
      escapeLabel: null,
      showCopyLink: false,
    };
  }

  if (env.platform === "android") {
    if (env.browser === "samsung") {
      return {
        title: "Dodaj do ekranu głównego",
        description: "Otwieraj plan jak aplikację — z ikony na ekranie.",
        steps: [
          {
            icon: "more",
            text: "Dotknij menu ☰ / ⋮ w pasku Samsung Internet.",
          },
          {
            icon: "download",
            text: "Wybierz „Dodaj stronę do” → „Ekran główny” (albo „Zainstaluj”).",
          },
        ],
        escapeLabel: null,
        showCopyLink: false,
      };
    }

    if (env.browser === "firefox") {
      return {
        title: "Dodaj do ekranu głównego",
        description: "Otwieraj plan jak aplikację — z ikony na ekranie.",
        steps: [
          {
            icon: "more",
            text: "Dotknij menu ⋮ w Firefox.",
          },
          {
            icon: "download",
            text: "Wybierz „Zainstaluj” albo „Dodaj do ekranu głównego”.",
          },
        ],
        escapeLabel: null,
        showCopyLink: false,
      };
    }

    // Chrome / Edge / unknown Android
    return {
      title: "Dodaj do ekranu głównego",
      description: "Otwieraj plan jak aplikację — z ikony na ekranie, bez szukania linku.",
      steps: [
        {
          icon: "more",
          text: "Dotknij menu ⋮ w prawym górnym rogu przeglądarki.",
        },
        {
          icon: "download",
          text: "Wybierz „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”.",
        },
      ],
      escapeLabel: null,
      showCopyLink: false,
    };
  }

  // Desktop
  return {
    title: "Zainstaluj aplikację",
    description: "Ikona instalacji jest zwykle w pasku adresu (Chrome / Edge).",
    steps: [
      {
        icon: "download",
        text: "Kliknij ikonę instalacji w pasku adresu albo menu ⋮ → „Zainstaluj aplikację”.",
      },
    ],
    escapeLabel: null,
    showCopyLink: false,
  };
}

/** Krótki copy na banner (nie Sheet). */
export function installBannerCopy(env: InstallEnv): { title: string; description: string; cta: string } {
  if (env.capability === "escape-required") {
    return {
      title: "Otwórz w przeglądarce",
      description: "W tej aplikacji trening może się nie zapisywać. Otwórz link w Safari lub Chrome.",
      cta: env.platform === "ios" ? "Otwórz w Safari" : "Otwórz w przeglądarce",
    };
  }
  if (env.capability === "native-prompt") {
    return {
      title: "Dodaj do ekranu głównego",
      description: "Otwieraj plan jak aplikację — z ikony na ekranie, bez szukania linku.",
      cta: "Dodaj do ekranu",
    };
  }
  return {
    title: "Dodaj do ekranu głównego",
    description: "Otwieraj plan jak aplikację — z ikony na ekranie, bez szukania linku.",
    cta: "Pokaż jak",
  };
}
