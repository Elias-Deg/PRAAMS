/**
 * Admin dashboard activity feed — humanized audit rows as a timeline.
 * Pure presentation; the page resolves names and passes display items.
 */
export interface FeedItem {
  id: string;
  tone: "created" | "changed" | "removed" | "other";
  text: string;
  meta: string;
}

const DOT: Record<FeedItem["tone"], string> = {
  created: "bg-status-completed",
  changed: "bg-status-scheduled",
  removed: "bg-status-cancelled",
  other: "bg-status-no-show",
};

export function toneForAction(action: string): FeedItem["tone"] {
  if (/^(INSERT|CREATE)_/.test(action) || action.startsWith("REACTIVATE")) return "created";
  if (/^(UPDATE|RESCHEDULE)_/.test(action)) return "changed";
  if (/^(CANCEL|DELETE|DEACTIVATE)_/.test(action)) return "removed";
  return "other";
}

export function ActivityFeed({ items }: { items: FeedItem[] }): React.ReactElement {
  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
        No activity recorded yet.
      </p>
    );
  }
  return (
    <ol className="relative ml-2 list-none space-y-4 border-l-2 border-gray-100 p-0">
      {items.map((item) => (
        <li key={item.id} className="relative pl-5">
          <span
            aria-hidden
            className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${DOT[item.tone]}`}
          />
          <p className="text-sm leading-snug text-gray-800">{item.text}</p>
          <p className="mt-0.5 text-xs text-gray-400">{item.meta}</p>
        </li>
      ))}
    </ol>
  );
}
