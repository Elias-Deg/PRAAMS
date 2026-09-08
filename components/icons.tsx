/** Minimal stroke icon set (24×24, currentColor) — no icon dependency. */
export type IconName =
  | "grid"
  | "users"
  | "calendar"
  | "userCog"
  | "shield"
  | "chart"
  | "logout"
  | "search"
  | "bell"
  | "plus"
  | "trend"
  | "chevron"
  | "check"
  | "close"
  | "clock";

const PATHS: Record<IconName, React.ReactNode> = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 19.5c0-3 2.5-4.75 5.5-4.75s5.5 1.75 5.5 4.75" />
      <path d="M15.5 5.25a3.25 3.25 0 0 1 0 5.5" />
      <path d="M17.5 14.9c1.8.65 3 1.95 3 4.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3.5M16 3v3.5" />
      <path d="M7.5 13h3M7.5 16.5h6" />
    </>
  ),
  userCog: (
    <>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 19.5c0-3 2.5-4.75 5.5-4.75s5.5 1.75 5.5 4.75" />
      <circle cx="17" cy="16.5" r="2.75" />
      <path d="M17 12.5v1.2M17 19.3v1.2M20.8 16.5h-1.2M14.4 16.5h-1.2M19.8 13.7l-.85.85M15.05 18.45l-.85.85M19.8 19.3l-.85-.85M15.05 14.55l-.85-.85" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 5 6v5.5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-2.5Z" />
      <path d="m9.25 11.75 2 2 3.5-3.75" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-6M12 20V6M17 20v-9" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14" />
      <path d="M17 15.5 20.5 12 17 8.5M20.5 12H10" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 10a6 6 0 1 0-12 0c0 4.5-2 5.5-2 5.5h16s-2-1-2-5.5" />
      <path d="M10 19a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trend: (
    <>
      <path d="m3.5 16 5-5.5 3.5 3 5.5-6" />
      <path d="M14 7.5h3.5V11" />
    </>
  ),
  chevron: <path d="m9 5.5 6.5 6.5L9 18.5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2.5" />
    </>
  ),
};

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}