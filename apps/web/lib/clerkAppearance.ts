/**
 * Appearance dla komponentów Clerka.
 *
 * Clerk nie przyjmuje klas Tailwind ani niezawodnie `var(--token)` w `variables`
 * (psuje generowanie skal kolorów). Hexy poniżej są lustrem warstwy 2 z
 * `apps/web/app/globals.css` — jedyne miejsce, gdzie wolno je podać do zewnętrznego SDK.
 * Przy zmianie palety WA zaktualizuj też ten plik.
 */
export const clerkAppearance = {
  variables: {
    colorBackground: "#1a1b1a", // --surface / --ink-850
    colorForeground: "#f2f4ec", // --foreground / --bone-100
    colorPrimary: "#c6f135", // --accent / --lime-500
    colorPrimaryForeground: "#0c0d0c", // --accent-foreground
    colorMutedForeground: "#9aa193", // --muted / --bone-500
    colorBorder: "#3a3c3a", // --border-strong
    colorInput: "#080908", // --surface-sunken
    colorDanger: "#e06a4a", // --danger / --clay-500
    colorRing: "#c6f135", // --accent
    borderRadius: "10px",
    fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
    fontFamilyMono: "var(--font-ibm-plex-mono), ui-monospace, monospace",
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
      backgroundColor: "#121312", // --surface-raised
      borderColor: "#3a3c3a", // --border-strong
      color: "#f2f4ec",
      boxShadow: "none",
      "&:hover": {
        backgroundColor: "#222322", // --surface-hover
      },
    },
    formButtonPrimary: {
      fontWeight: "600",
      boxShadow: "none",
    },
    card: {
      boxShadow: "none",
      border: "1px solid #2a2c2a", // --border
    },
    footer: {
      background: "transparent",
    },
  },
};
