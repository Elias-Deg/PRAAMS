import type { UserRole } from "@/types/database";

const LABELS: Record<UserRole, string> = {
  receptionist: "Receptionist",
  healthcare_professional: "Healthcare Professional",
  administrator: "Administrator",
};

const PILL_CLASSES: Record<UserRole, string> = {
  receptionist: "bg-role-receptionist",
  healthcare_professional: "bg-role-healthcare",
  administrator: "bg-role-administrator",
};

/** Desaturated role pill (§9 palette). */
export function RoleBadge({ role }: { role: UserRole }): React.ReactElement {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${PILL_CLASSES[role]}`}
    >
      {LABELS[role]}
    </span>
  );
}