import { NextResponse, type NextRequest } from "next/server";

import { getCurrentProfile } from "@/lib/auth/session";
import { buildReport, isReportType, toCsv } from "@/lib/reports/data";

/**
 * FR-19 — CSV export for generated reports. Administrator-only (FR-03);
 * output streams as an attachment with a descriptive filename.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (profile.role !== "administrator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const rawType = sp.get("type") ?? "";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  if (!isReportType(rawType) || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
    return NextResponse.json({ error: "Invalid report parameters." }, { status: 400 });
  }

  const report = await buildReport({ type: rawType, from, to });
  const csv = toCsv(report.columns, report.rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="praams-${rawType}-${from}_to_${to}.csv"`,
    },
  });
}