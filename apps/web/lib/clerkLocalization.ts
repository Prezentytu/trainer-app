import { plPL } from "@clerk/localizations";

/**
 * Polski Clerk + nadpisania pod RepMaxer.
 * Ukrywamy angielskie placeholdery i zdublowane nagłówki karty.
 */
export const clerkLocalization = {
  ...plPL,
  formFieldInputPlaceholder__password: "Wprowadź hasło",
  formFieldInputPlaceholder__signUpPassword: "Utwórz hasło",
  formFieldInputPlaceholder__emailAddress: "Wprowadź adres e-mail",
  signUp: {
    ...plPL.signUp,
    start: {
      ...plPL.signUp?.start,
      title: "Załóż konto",
      titleCombined: "Załóż konto",
      subtitle: " ",
      subtitleCombined: " ",
    },
  },
  signIn: {
    ...plPL.signIn,
    start: {
      ...plPL.signIn?.start,
      title: "Zaloguj się",
      titleCombined: "Zaloguj się",
      subtitle: " ",
    },
  },
};
