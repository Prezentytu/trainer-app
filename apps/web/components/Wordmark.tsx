import Link from "next/link";

type WordmarkProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

/** Wordmark Acid — lime block + Archivo 900 UPPERCASE. Never draw a mark. */
export function Wordmark({ href = "/", compact = false, className = "" }: WordmarkProps) {
  const content = compact ? (
    <span className="inline-flex h-3 w-3 shrink-0 bg-accent" aria-hidden title="RepMaxer" />
  ) : (
    <>
      <span className="inline-flex h-2.5 w-2.5 shrink-0 bg-accent" aria-hidden />
      <span className="display-caps text-sm text-foreground">RepMaxer</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={compact ? "RepMaxer" : undefined}
        className={`flex items-center gap-2.5 ${className}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={`flex items-center gap-2.5 ${className}`}>{content}</div>;
}
