"use client";

import type { ReactNode } from "react";

/**
 * Submit button that asks for confirmation first (NFR-05: confirm dialogs
 * before destructive actions such as deactivating staff or deleting
 * accounts). Uses a native dialog so keyboard/screen-reader interaction and
 * focus handling come free.
 */
export function ConfirmSubmitButton({
  confirmation,
  className,
  disabled,
  title,
  children,
}: {
  confirmation: string;
  className?: string;
  disabled?: boolean;
  /** Native tooltip — used to explain why a guarded action is disabled. */
  title?: string;
  children: ReactNode;
}): React.ReactElement {
  return (
    <button
      type="submit"
      disabled={disabled}
      title={title}
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmation)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}