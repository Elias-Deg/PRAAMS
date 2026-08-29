"use client";

/** FR-19 — print (→ print-to-PDF) support for the report view. */
export function PrintButton(): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-sm border border-navy bg-white px-4 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-navy-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
    >
      Print / Save as PDF
    </button>
  );
}