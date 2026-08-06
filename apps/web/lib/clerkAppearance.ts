/**
 * Appearance dla komponentów Clerka.
 *
 * Clerk nie przyjmuje klas Tailwind ani niezawodnie `var(--token)` w `variables`
 * (psuje generowanie skal kolorów). Hexy poniżej są lustrem mono z
 * `apps/web/app/globals.css` — jedyne miejsce, gdzie wolno je podać do zewnętrznego SDK.
 * Przy zmianie palety zaktualizuj też ten plik.
 */
export const clerkAppearance = {
  variables: {
    colorBackground: "#17191B", // --surface / --ink-800
    colorForeground: "#FFFFFF", // --fg
    colorPrimary: "#FFFFFF", // --invert-bg / --accent
    colorPrimaryForeground: "#0B0C0D", // --invert-fg
    colorMutedForeground: "#9AA1A8", // --fg-faint
    colorBorder: "#33373B", // --line
    colorInput: "#212427", // --field
    colorDanger: "#FF6B6B", // --danger
    colorRing: "#FFFFFF", // --fg (focus)
    borderRadius: "8px",
    fontFamily: "var(--font-instrument-sans), system-ui, sans-serif",
    fontFamilyMono: "var(--font-geist-mono), ui-monospace, monospace",
  },
  layout: {
    elevation: "flush" as const,
    logoPlacement: "none" as const,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
    unsafe_disableDevelopmentModeWarnings: true,
  },
  elements: {
    // AuthScreen ma własny tytuł — unikamy dublowania z kartą Clerka
    header: { display: "none" },
    // AuthScreen ma własny przełącznik sign-in / sign-up
    footerAction: { display: "none" },
    socialButtonsBlockButton: {
      backgroundColor: "#212427", // --surface-raised
      borderColor: "#33373B", // --line
      color: "#FFFFFF",
      boxShadow: "none",
      "&:hover": {
        backgroundColor: "#2B2F33", // --ink-600
      },
    },
    formButtonPrimary: {
      fontWeight: "600",
      boxShadow: "none",
    },
    card: {
      boxShadow: "none",
      border: "1px solid #2B2F33", // --line-faint
    },
    footer: {
      background: "transparent",
    },
  },
};
