import { NextResponse, type NextRequest } from "next/server";

import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Lightweight patient lookup for booking comboboxes (UC-09). Returns only the
 * fields needed to identify a patient — never full records (NFR-02/NFR-09).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = (request.nextUrl.searchParams.get("q") ?? "")
    .trim()
    .replace(/[%_,()]/g, "");
  if (raw.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("patients")
    .select("id, full_name, patient_code, phone")
    .or(`full_name.ilike.*${raw}*,patient_code.ilike.*${raw}*,phone.ilike.*${raw}*`)
    .order("full_name")
    .limit(8);

  return NextResponse.json({ results: data ?? [] });
}