/**
 * Mapa kodów błędów Clerka → komunikaty po polsku.
 * Fallback: message / longMessage z API.
 */

type FieldErrorLike = {
  code?: string;
  message?: string;
  longMessage?: string;
} | null | undefined;

/** Luźny kształt zgodny z SignInErrors / SignUpErrors Clerka. */
type ErrorsLike = {
  fields?: {
    identifier?: FieldErrorLike;
    emailAddress?: FieldErrorLike;
    password?: FieldErrorLike;
    code?: FieldErrorLike;
    legalAccepted?: FieldErrorLike;
    captcha?: FieldErrorLike;
  };
  global?: Array<{ code?: string; message?: string; longMessage?: string }> | null;
};

const CODE_MESSAGES: Record<string, string> = {
  form_password_incorrect: "Nieprawidłowe hasło.",
  form_identifier_not_found: "Nie znaleziono konta z tym adresem e-mail.",
  form_identifier_exists: "Konto z tym adresem e-mail już istnieje.",
  form_code_incorrect: "Nieprawidłowy kod. Sprawdź e-mail i spróbuj ponownie.",
  form_password_pwned: "To hasło wyciekło w innym serwisie. Wybierz inne.",
  form_password_length_too_short: "Hasło jest za krótkie.",
  form_password_validation_failed: "Hasło nie spełnia wymagań bezpieczeństwa.",
  form_param_format_invalid: "Sprawdź format wprowadzonych danych.",
  form_param_nil: "Uzupełnij wymagane pole.",
  form_password_not_strong_enough: "Hasło jest za słabe. Użyj dłuższej, bardziej złożonej kombinacji.",
  session_exists: "Jesteś już zalogowany.",
  too_many_requests: "Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.",
  not_allowed_access: "Logowanie tym sposobem jest niedostępne.",
  oauth_access_denied: "Odrzucono dostęp Google. Spróbuj ponownie.",
  oauth_identification_claimed: "To konto Google jest już połączone z innym użytkownikiem.",
  captcha_invalid: "Weryfikacja antybot nie powiodła się. Odśwież stronę.",
  strategy_for_user_invalid: "Ta metoda logowania nie jest dostępna dla tego konta.",
};

function messageForCode(code: string | undefined, fallback?: string): string | null {
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  if (fallback?.trim()) return fallback;
  return null;
}

/** Pierwszy globalny lub polowy błąd jako jeden komunikat do ErrorBanner. */
export function authErrorMessage(errors: ErrorsLike | null | undefined): string | null {
  if (!errors) return null;

  const global = errors.global?.[0];
  if (global) {
    return messageForCode(global.code, global.longMessage ?? global.message);
  }

  const fields = errors.fields;
  if (fields) {
    const ordered: FieldErrorLike[] = [
      fields.identifier,
      fields.emailAddress,
      fields.password,
      fields.code,
      fields.legalAccepted,
      fields.captcha,
    ];
    for (const field of ordered) {
      if (field) {
        return messageForCode(field.code, field.longMessage ?? field.message);
      }
    }
  }

  return null;
}

/** Komunikat dla konkretnego pola. */
export function fieldErrorMessage(field: FieldErrorLike): string | null {
  if (!field) return null;
  return messageForCode(field.code, field.longMessage ?? field.message);
}

export function isIdentifierExists(errors: ErrorsLike | null | undefined): boolean {
  if (!errors) return false;
  if (errors.global?.some((e) => e.code === "form_identifier_exists")) return true;
  return errors.fields?.emailAddress?.code === "form_identifier_exists";
}

export function isIdentifierNotFound(errors: ErrorsLike | null | undefined): boolean {
  if (!errors) return false;
  if (errors.global?.some((e) => e.code === "form_identifier_not_found")) return true;
  return errors.fields?.identifier?.code === "form_identifier_not_found";
}
