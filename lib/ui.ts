/**
 * App-wide theme strings (§14 "login language") — single source of truth for
 * interactive surfaces so every screen stays visually identical:
 * Poppins display headings, pill fields, accent pills, rounded-3xl cards,
 * soft tiles, and the playful motion tokens (pop-in / hover lift).
 *
 * Pages and forms may still inline layout utilities, but the field, button,
 * banner, tile and chip treatments must come from here.
 */

/** Pill text field — surface fill, white + blue ring on focus. */
export const inputClasses =
  "mt-2 block w-full rounded-full border-2 border-gray-200 bg-surface px-5 py-3 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-accent focus:bg-white focus:shadow-pop";

/** Multi-line sibling of the pill field (textareas can't be pills). */
export const textareaClasses =
  "mt-2 block w-full resize-y rounded-3xl border-2 border-gray-200 bg-surface px-4 py-3 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-accent focus:bg-white focus:shadow-pop";

export const labelClasses = "block text-sm font-bold text-gray-900";

/** Primary action: accent pill with bubbly hover lift. */
export const primaryButtonClasses =
  "inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-5 py-3 font-display text-sm font-bold text-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-navy-light hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] sm:w-auto sm:min-w-[180px]";

/** Secondary action: quiet bordered pill. */
export const secondaryButtonClasses =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-navy transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy active:scale-[0.98]";

/** Compact "back to …" navigation pill. */
export const backPillClasses =
  "inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-navy transition-all hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

export const cardClasses = "rounded-3xl bg-white p-5 shadow-soft";

export const pageTitleClasses = "font-display text-2xl font-bold text-gray-900";

export const pageSubtitleClasses = "mt-1 text-sm text-gray-600";

export const errorBannerClasses =
  "animate-pop-in rounded-2xl border-l-4 border-status-cancelled bg-[#fae3e2]/60 px-4 py-3 text-sm text-gray-800";

export const successBannerClasses =
  "animate-pop-in rounded-2xl border-l-4 border-status-completed bg-[#dcf0e7]/60 px-4 py-3 text-sm text-gray-800";

export const warningBannerClasses =
  "animate-pop-in rounded-2xl border-l-4 border-status-no-show bg-[#f5ebd8]/60 px-4 py-3 text-sm text-gray-600";

export const fieldErrorClasses = "mt-1.5 text-xs font-medium text-status-cancelled";

/** Soft data tile used for read-only label/value pairs. */
export const tileClasses = "rounded-2xl bg-surface px-4 py-3";

export const tileLabelClasses =
  "text-[10px] font-bold uppercase tracking-wider text-gray-400";

export const tileValueClasses = "mt-0.5 truncate text-sm font-semibold text-gray-800";

/** Small uppercase chip (counts, statuses, permanence notes). */
export const chipClasses =
  "rounded-full bg-navy-tint px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy";
