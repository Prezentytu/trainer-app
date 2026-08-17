import next from "eslint-config-next";

const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "e2e/**", "playwright.config.ts", "playwright-report/**", "test-results/**"],
  },
];

export default eslintConfig;
