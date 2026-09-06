/** Dashboard stat tile — real number, quiet label. */
export function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-surface p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-navy">{value}</p>
    </div>
  );
}
