const PALETTE = [
  "bg-navy",
  "bg-role-receptionist",
  "bg-role-healthcare",
  "bg-status-scheduled",
  "bg-status-completed",
  "bg-role-administrator",
];

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
} as const;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

/**
 * Consistent colored-initial avatar for people (staff & patients).
 * Color derives from the name so the same person is always the same color.
 */
export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: keyof typeof SIZES;
}): React.ReactElement {
  const hash = Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (
    <span
      aria-hidden
      className={`${SIZES[size]} ${PALETTE[hash % PALETTE.length]} flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-pop ring-2 ring-white select-none`}
    >
      {initialsOf(name)}
    </span>
  );
}