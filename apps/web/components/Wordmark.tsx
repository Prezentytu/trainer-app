import Link from "next/link";

type WordmarkProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

/** Wordmark Acid — lime block + Archivo 900 UPPERCASE. Never draw a mark. */
export function Wordmark({ href = "/", compact = false, className = "" }: WordmarkProps) {
  const content = (
    <>
      <span className="inline-flex h-2.5 w-2.5 shrink-0 bg-accent" aria-hidden />
      {compact ? (
        <span className="display-caps text-sm text-foreground">WA</span>
      ) : (
        <span className="display-caps text-sm text-foreground">Workout Alchemist</span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`flex items-center gap-2.5 ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`flex items-center gap-2.5 ${className}`}>{content}</div>;
}
