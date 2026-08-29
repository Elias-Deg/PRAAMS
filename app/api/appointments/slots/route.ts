import { NextResponse, type NextRequest } from "next/server";

import { ADDIS_UTC_OFFSET, generateDaySlots, todayInAddis } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * FR-14 — available time slots per healthcare professional for one Addis
 * calendar date. Returns only future, clinic-hours slots; booked ones carry
 * available:false so the UI can render them greyed out.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staffId = request.nextUrl.searchParams.get("staff") ?? "";
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(staffId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid query." }, { status: 400 });
  }
  if (date < todayInAddis()) {
    return NextResponse.json({ slots: [] });
  }

  const slots = generateDaySlots(date);
  if (slots.length === 0) {
    return NextResponse.json({ slots: [], closed: true });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("appointments")
    .select("date_time")
    .eq("staff_id", staffId)
    .eq("status", "scheduled")
    .gte("date_time", `${date}T00:00:00${ADDIS_UTC_OFFSET}`)
    .lte("date_time", `${date}T23:59:59${ADDIS_UTC_OFFSET}`);

  const booked = new Set(
    ((data ?? []) as { date_time: string }[]).map((row) => Date.parse(row.date_time)),
  );
  const nowMs = Date.now();

  return NextResponse.json({
    slots: slots.map((iso) => {
      const ms = Date.parse(iso);
      return {
        iso,
        label: iso.slice(11, 16),
        available: ms > nowMs && !booked.has(ms),
      };
    }),
    closed: false,
  });
}