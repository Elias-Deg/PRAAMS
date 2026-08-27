"use client";

import { useFormStatus } from "react-dom";

import { toggleRolePermission } from "@/lib/actions/permissions";

function SubmitLabel({ granted }: { granted: boolean }): React.ReactElement {
  const { pending } = useFormStatus();
  if (pending) return <span>Updating…</span>;
  return <span>{granted ? "Granted" : "Denied"}</span>;
}

/**
 * Pill button toggling one (role, permission) grant via a Server Action.
 * Announces its state with aria-pressed; the server response revalidates the
 * page so the control always reflects persisted reality after refresh.
 */
export function PermissionToggle({
  role,
  permission,
  granted,
}: {
  role: string;
  permission: string;
  granted: boolean;
}): React.ReactElement {
  return (
    <form action={toggleRolePermission}>
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="permission" value={permission} />
      <input type="hidden" name="enable" value={granted ? "false" : "true"} />
      <button
        type="submit"
        aria-pressed={granted}
        className={`inline-block min-w-[92px] rounded-full px-3 py-1 text-xs font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-wait disabled:opacity-70 ${
          granted ? "bg-status-completed hover:bg-navy-dark" : "bg-gray-400 hover:bg-gray-500"
        }`}
      >
        <SubmitLabel granted={granted} />
      </button>
    </form>
  );
}