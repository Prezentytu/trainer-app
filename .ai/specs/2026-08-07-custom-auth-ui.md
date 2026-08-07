# Własne ekrany logowania i rejestracji (headless Clerk)

## TLDR

Zastępujemy osadzone `<SignIn/>` / `<SignUp/>` Clerka własnymi formularzami na headless API Clerk 7 (Future hooks): Google OAuth, e-mail + hasło, rejestracja z kodem, reset hasła — w pełni na tokenach mono v2. Sesja JWT i backend bez zmian.

## Problem

`AuthScreen` owija widget Clerka stylowany hexami w `clerkAppearance.ts`. Efekt: dwa systemy designu, „Development mode” / „Secured by Clerk” w karcie, brak kontroli nad krokami i mikrocopy. Appearance i localization to dual-maintenance palety.

## Proponowane rozwiązanie

1. Własne formularze na `useSignIn` / `useSignUp` (Future API z `@clerk/nextjs`): `password()`, `sso()`, `resetPasswordEmailCode.*`, `verifications.*`, `finalize()`.
2. Routing bez catch-alli; nowa `/sso-callback` z `<AuthenticateWithRedirectCallback />`.
3. Reset i weryfikacja e-maila jako kroki stanu komponentu (nie osobne URL-e).
4. Usunięcie `clerkAppearance.ts`, `clerkLocalization.ts`, `@clerk/localizations`.
5. `ClerkProvider`, `proxy.ts`, `auth.protect()`, `AuthTokenBridge`, `TrainerAccess` — bez zmian kontraktu.

## Model danych

Brak zmian w bazie / encjach.

## Kontrakt API

Brak zmian API. Auth nadal przez Bearer JWT Clerka.

## UI

| Plik | Rola |
|---|---|
| `components/auth/AuthScreen.tsx` | Split-screen layout (bez consent / `.cl-*`) |
| `components/auth/SignInForm.tsx` | Google + e-mail/hasło |
| `components/auth/SignUpForm.tsx` | Rejestracja + weryfikacja kodem + captcha |
| `components/auth/ResetPasswordForm.tsx` | Reset hasła (kroki) |
| `components/auth/GoogleButton.tsx` | SSO button + SVG Google |
| `components/auth/PasswordField.tsx` | Hasło + pokaż/ukryj |
| `components/auth/CodeInput.tsx` | 6-cyfrowy OTP |
| `components/auth/authErrors.ts` | Mapa kodów Clerka → PL |
| `app/sign-in/page.tsx` | Strona logowania |
| `app/sign-up/page.tsx` | Strona rejestracji |
| `app/sso-callback/page.tsx` | Callback OAuth |

Prymitywy: `Button`, `Field`, `inputClass`, `ErrorBanner`. Skille: `design-system`, `senior-ux-cro`, `responsive-ui`, `apple-design`.

## Fazy implementacji

- [x] Faza 1 — spec + routing + Guard `/sso-callback`
- [x] Faza 2 — prymitywy auth + SignInForm + ResetPasswordForm
- [x] Faza 3 — SignUpForm (zgoda, captcha, kod)
- [x] Faza 4 — cleanup appearance/localization + bramka

## Ryzyka i wpływ

| Ryzyko | Mitygacja |
|---|---|
| Instancja Clerk bez Password / Google | Sprawdzić Dashboard przed shipem; komunikat przy błędzie strategii |
| CAPTCHA bez `#clerk-captcha` | Kontener w SignUpForm |
| Autofill menedżerów haseł | E-mail + hasło na jednym ekranie |
| Future API vs legacy docs | Tylko Future; zweryfikowane w node_modules 7.6.3 |

## Changelog

- 2026-08-07 — utworzono spec (headless Clerk 7 Future, Google + password).
- 2026-08-07 — wdrożono custom auth UI: SignIn/SignUp/Reset/SSO callback; usunięto clerkAppearance, clerkLocalization, `@clerk/localizations`.
