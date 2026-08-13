/** Phosphor Icons (web font) — regular weight, currentColor, never filled. */

export type IconName =
  | "barbell"
  | "person-simple-run"
  | "trend-up"
  | "gear"
  | "plus"
  | "caret-left"
  | "caret-right"
  | "caret-down"
  | "trash"
  | "x-circle"
  | "x"
  | "calendar-blank"
  | "check"
  | "check-circle"
  | "magnifying-glass"
  | "pencil-simple"
  | "clock-countdown"
  | "timer"
  | "house"
  | "users"
  | "clipboard-text"
  | "list"
  | "menu"
  | "sign-out"
  | "share-network"
  | "download-simple"
  | "play"
  | "sliders-horizontal"
  | "warning-circle"
  | "trophy"
  | "history"
  | "clock-counter-clockwise"
  | "activity"
  | "pulse"
  | "ruler"
  | "dots-three"
  | "copy-simple"
  | "stack"
  | "circle"
  | "user"
  | "eye"
  | "eye-slash"
  | "lock-simple"
  | "push-pin"
  | "push-pin-slash"
  | "note-blank"
  | "chat-text"
  | "calculator"
  | "image"
  // English aliases
  | "copy"
  | "lock"
  | "pin"
  | "unpin"
  | "note"
  | "chat"
  | "dumbbell"
  | "workout"
  | "progress"
  | "settings"
  | "back"
  | "forward"
  | "delete"
  | "search"
  | "edit"
  | "home"
  | "clients"
  | "plans"
  | "close"
  | "share"
  | "download"
  | "warning"
  | "more";

const ALIASES: Partial<Record<IconName, string>> = {
  dumbbell: "barbell",
  workout: "person-simple-run",
  progress: "trend-up",
  settings: "gear",
  back: "caret-left",
  forward: "caret-right",
  delete: "trash",
  search: "magnifying-glass",
  edit: "pencil-simple",
  home: "house",
  clients: "users",
  plans: "clipboard-text",
  close: "x",
  share: "share-network",
  download: "download-simple",
  warning: "warning-circle",
  more: "dots-three",
  copy: "copy-simple",
  timer: "clock-countdown",
  list: "list",
  menu: "list",
  history: "clock-counter-clockwise",
  activity: "pulse",
  lock: "lock-simple",
  pin: "push-pin",
  unpin: "push-pin-slash",
  note: "note-blank",
  chat: "chat-text",
};

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
  /** Decorative when no title — sets aria-hidden. */
  decorative?: boolean;
};

export function Icon({ name, size = 18, className = "", title, decorative }: IconProps) {
  const glyph = ALIASES[name] ?? name;
  const ariaHidden = decorative || !title;
  return (
    <i
      className={`ph ph-${glyph} ${className}`}
      style={{
        fontSize: size,
        lineHeight: 1,
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      aria-hidden={ariaHidden || undefined}
      title={title}
      role={title && !decorative ? "img" : undefined}
      aria-label={title && !decorative ? title : undefined}
    />
  );
}
