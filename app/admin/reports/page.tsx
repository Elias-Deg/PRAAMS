import type { Metadata } from "next";
import Link from "next/link";

import { PrintButton } from "@/components/print-button";
import { requireAdministrator } from "@/lib/auth/session";
import { todayInAddis } from "@/lib/constants";
import {
  buildReport,
  isReportType,
  REPORT_LABELS,
  REPORT_TYPES,
  validRange,
} from "@/lib/reports/data";

export const metadata: Metadata = {
  title: "Reports",
};

const inputClasses =
  "mt-1.5 block w-full rounded-sm border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-navy-light focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-navy-light";
const labelClasses = "block text-sm font-medium text-gray-700";

/** UC-12 · FR-18/19 — generate, view, print or export administrative reports. */
export default async function ReportsPage({
  searchParams,
}: PageProps<"/admin/reports">): Promise<React.ReactElement> {
  await requireAdministrator();
  const sp = await searchParams;

  const rawType = typeof sp.type === "string" ? sp.type : "registrations";
  const type = isReportType(rawType) ? rawType : "registrations";

  const today = todayInAddis();
  const defaultFrom = new Date(Date.parse(`${today}T00:00:00Z`) - 29 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const from = typeof sp.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : defaultFrom;
  const to = typeof sp.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : today;
  const rangeOk = validRange(from, to);

  const report = rangeOk ? await buildReport({ type, from, to }) : null;
  const exportHref = `/admin/reports/export?type=${type}&from=${from}&to=${to}`;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-navy underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none print:hidden"
      >
        ← Back to dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-navy">Administrative reports</h1>
      <p className="mt-1 text-sm text-gray-600">
        Generate date-range reports, view them on screen, print (or save as PDF) and
        export CSV — UC-12.
      </p>

      {/* --- PARAMETERS (hidden in print) --- */}
      <form
        action="/admin/reports"
        method="get"
        className="mt-6 grid items-end gap-4 rounded-md border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-[1.4fr_1fr_1fr_auto] print:hidden"
      >
        <div>
          <label htmlFor="type" className={labelClasses}>
            Report
          </label>
          <select id="type" name="type" defaultValue={type} className={inputClasses}>
            {REPORT_TYPES.map((value) => (
              <option key={value} value={value}>
                {REPORT_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="from" className={labelClasses}>
            From
          </label>
          <input id="from" name="from" type="date" defaultValue={from} max={today} className={inputClasses} />
        </div>
        <div>
          <label htmlFor="to" className={labelClasses}>
            To
          </label>
          <input id="to" name="to" type="date" defaultValue={to} max={today} className={inputClasses} />
        </div>
        <button
          type="submit"
          className="h-[42px] rounded-sm bg-navy px-5 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          Generate
        </button>
      </form>

      {!rangeOk && (
        <p role="alert" className="mt-6 rounded-md border-l-4 border-status-cancelled bg-white px-4 py-3 text-sm text-gray-800 shadow-sm">
          The date range is invalid — “From” must be on or before “To”.
        </p>
      )}

      {report && (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-navy">{report.title}</h2>
              <p className="text-sm text-gray-500">
                {from} → {to}
              </p>
            </div>
            <div className="flex gap-3 print:hidden">
              <PrintButton />
              <a
                href={exportHref}
                className="rounded-sm bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Export CSV
              </a>
            </div>
          </div>

          {/* --- SUMMARY CHIPS --- */}
          <div className="mt-4 flex flex-wrap gap-2">
            {report.summary.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-2 rounded-full bg-navy-tint px-3 py-1 text-xs font-semibold text-navy"
              >
                {chip.label}
                <span className="rounded-full bg-white px-2 py-0.5">{chip.value}</span>
              </span>
            ))}
          </div>

          {report.truncated && (
            <p className="mt-3 rounded-sm border-l-4 border-status-no-show bg-white px-4 py-2.5 text-xs text-gray-600 shadow-sm">
              Showing the latest 500 rows — the full count is in the summary. Narrow the
              date range to see everything on screen.
            </p>
          )}

          {/* --- REPORT TABLE --- */}
          {report.rows.length === 0 ? (
            <div className="mt-4 rounded-md border border-gray-200 bg-white p-10 text-center shadow-sm">
              <p className="text-sm font-semibold text-gray-800">No data for this range</p>
              <p className="mt-1 text-sm text-gray-500">Try a wider date range.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-navy-tint text-xs uppercase tracking-wider text-navy">
                  <tr>
                    {report.columns.map((column) => (
                      <th key={column} scope="col" className="px-4 py-3">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.rows.map((row, index) => (
                    <tr key={index} className="even:bg-gray-50/60">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2.5 text-gray-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}