import Link from "next/link";

type WordmarkProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export function Wordmark({ href = "/", compact = false, className = "" }: WordmarkProps) {
  const content = (
    <>
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent font-display text-sm font-bold text-accent-foreground">
        WA
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight">
          Workout <span className="text-accent">Alchemist</span>
        </span>
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
