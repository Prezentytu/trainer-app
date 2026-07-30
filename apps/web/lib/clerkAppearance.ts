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
    colorBackground: "#141618", // --surface / --ink-850
    colorForeground: "#f3f1ec", // --foreground / --bone-100
    colorPrimary: "#3e9c8f", // --accent / --teal-500
    colorPrimaryForeground: "#04120f", // --accent-foreground
    colorMutedForeground: "#93958f", // --muted / --bone-500
    colorBorder: "#343a3b", // --border-strong
    colorInput: "#0a0b0c", // --surface-sunken / --ink-950
    colorDanger: "#cf6b4b", // --danger / --clay-500
    colorRing: "#3e9c8f", // --accent
    borderRadius: "10px",
    fontFamily: "var(--font-instrument), system-ui, sans-serif",
    fontFamilyMono: "var(--font-ibm-plex-mono), ui-monospace, monospace",
  },
  layout: {
    elevation: "flush" as const,
    logoPlacement: "none" as const,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
    unsafe_disableDevelopmentModeWarnings: true,
  },
};
