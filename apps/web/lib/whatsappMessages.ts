export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "Cześć";
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function prCongratsMessage(name: string, exercise: string, weightKg?: number | null): string {
  const first = firstName(name);
  const load = weightKg != null ? ` (${weightKg} kg)` : "";
  return `Cześć ${first}. Nowy rekord w ${exercise}${load} — tak trzymaj. Jak czujesz kolejny trening, daj znać.`;
}

export function afterSessionMessage(name: string, dayLabel?: string | null): string {
  const first = firstName(name);
  const day = dayLabel ? ` (${dayLabel})` : "";
  return `Cześć ${first}. Widziałem trening${day}. Jak poszło na sali — ciężar OK, czy coś podmieniamy?`;
}
