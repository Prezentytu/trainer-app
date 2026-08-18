import Link from "next/link";
import { Icon } from "@/components/Icon";

/** Powrót na ekranach portalu bez tab bara (sesja, ankieta, pomiary). */
export function PortalBackLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-[color,transform] duration-[var(--dur-fast)] hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] active:scale-[0.97]"
    >
      <Icon name="caret-left" size={16} decorative />
      {children}
    </Link>
  );
}
