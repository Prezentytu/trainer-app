import next from "eslint-config-next";

// Reguły z AGENTS.md (Never), egzekwowane programem zamiast prozą.
const RAW_FETCH_MESSAGE =
  "Surowy fetch poza warstwą API: użyj obiektu `api` z `@/lib/api` (request<T>() mapuje błędy na polski komunikat, retry).";
const RAW_COLOR_MESSAGE =
  "Surowa klasa koloru albo hex w className: użyj tokenów z app/globals.css (mono v2, skill design-system).";
// zinc-500, bg-red-400/50, border-[#fff], shadow-[0_0_0_1px_#fff] itp. Paleta z AGENTS.md: zinc/lime/yellow/teal/red/emerald.
const RAW_COLOR_PATTERN = String.raw`(^|[\s:"'\x60-])(zinc|lime|yellow|teal|red|emerald)-(50|[1-9]00|950)\b|\[[^\]]*#[0-9a-fA-F]{3,8}\b[^\]]*\]`;

const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "e2e/**", "playwright.config.ts", "playwright-report/**", "test-results/**"],
  },
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    // Warstwa API: wrapper request<T>() i serwerowy odczyt imienia trenera do metadata portalu.
    // Route handlery (route.ts/tsx) działają po stronie serwera i ładują m.in. fonty do ImageResponse.
    ignores: ["lib/api.ts", "lib/portalBrand.ts", "app/**/route.{ts,tsx}"],
    rules: {
      "no-restricted-globals": ["error", { name: "fetch", message: RAW_FETCH_MESSAGE }],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "fetch", message: RAW_FETCH_MESSAGE },
        { object: "globalThis", property: "fetch", message: RAW_FETCH_MESSAGE },
        { object: "self", property: "fetch", message: RAW_FETCH_MESSAGE },
      ],
    },
  },
  {
    files: ["app/**/*.tsx", "components/**/*.tsx", "lib/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `JSXAttribute[name.name=/[cC]lassName$/] Literal[value=/${RAW_COLOR_PATTERN}/]`,
          message: RAW_COLOR_MESSAGE,
        },
        {
          selector: `JSXAttribute[name.name=/[cC]lassName$/] TemplateElement[value.raw=/${RAW_COLOR_PATTERN}/]`,
          message: RAW_COLOR_MESSAGE,
        },
      ],
    },
  },
];

export default eslintConfig;
