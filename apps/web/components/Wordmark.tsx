import Link from "next/link";

type WordmarkProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

/** Wordmark mono — sam typ „RepMaxer” / „RM”, bez kafelka. */
export function Wordmark({ href = "/", compact = false, className = "" }: WordmarkProps) {
  const content = (
    <span className="display-caps text-[13px] text-foreground">
      {compact ? "RM" : "RepMaxer"}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={compact ? "RepMaxer" : undefined}
        className={`flex items-center ${className}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={`flex items-center ${className}`}>{content}</div>;
}
