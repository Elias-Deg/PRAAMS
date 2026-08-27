/**
 * PRAAMS database seed (Phase 0) — replaces the brief's `/supabase/seed.sql`.
 *
 * Why a script instead of raw SQL: seeding staff requires inserting rows into
 * `auth.users`, and Supabase's supported way to create auth users is the
 * GoTrue admin API (`auth.admin.createUser`) via the service-role key — raw
 * inserts into the `auth` schema are undocumented and fragile across versions.
 *
 * Prerequisite: the migration in supabase/migrations/ has been applied.
 * Idempotent: safe to re-run; existing entities are skipped, not duplicated.
 *
 * Run: npm run db:seed   (= tsx --env-file=.env.local scripts/seed.ts)
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Demo credentials — printed at the end of the run; passwords live only in GoTrue. */
const STAFF = [
  {
    email: "liya.bekele@praams.clinic",
    password: "Praams#Rec2026",
    fullName: "Liya Bekele",
    role: "receptionist" as const,
    phone: "+251911234001",
  },
  {
    email: "dr.kassa@praams.clinic",
    password: "Praams#Hp2026",
    fullName: "Dr. Kassa Alemu",
    role: "healthcare_professional" as const,
    phone: "+251911234002",
  },
  {
    email: "meron.tadesse@praams.clinic",
    password: "Praams#Adm2026",
    fullName: "Meron Tadesse",
    role: "administrator" as const,
    phone: "+251911234003",
  },
];

async function writeAudit(
  userId: string,
  action: string,
  targetEntity: string,
  targetId: string,
): Promise<void> {
  const { error } = await admin.from("audit_logs").insert({
    user_id: userId,
    action,
    target_entity: targetEntity,
    target_id: targetId,
  });
  if (error) throw error;
}

type StaffProfile = { id: string };

async function ensureStaffUser(staff: (typeof STAFF)[number]): Promise<StaffProfile> {
  const upsertProfile = async (userId: string): Promise<void> => {
    // Normally created by the handle_new_user() trigger; upsert is the backstop.
    const { error } = await admin.from("profiles").upsert({
      id: userId,
      full_name: staff.fullName,
      email: staff.email,
      role: staff.role,
      phone: staff.phone,
      status: "active",
    }, { onConflict: "id" });
    if (error) throw error;
  };

  const { data, error } = await admin.auth.admin.createUser({
    email: staff.email,
    password: staff.password,
    email_confirm: true,
    user_metadata: { full_name: staff.fullName, role: staff.role },
  });

  if (!error && data.user) {
    await upsertProfile(data.user.id);
    console.log(`[staff]    created ${staff.email} (${staff.role})`);
    return { id: data.user.id };
  }

  if (!error) throw new Error(`Unexpected empty user for ${staff.email}`);

  // User already registered → resolve their id and refresh profile fields.
  let foundId: string | undefined;
  let page = 1;
  while (!foundId) {
    const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (listErr) throw listErr;
    foundId = listed.users.find((u) => u.email === staff.email)?.id;
    if (!listed.users.length || listed.users.length < 200) break;
    page += 1;
  }
  if (!foundId) throw new Error(`Could not resolve existing auth user ${staff.email}`);
  await upsertProfile(foundId);
  console.log(`[staff]    exists  ${staff.email} (${staff.role})`);
  return { id: foundId };
}

async function ensurePatient(input: {
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  registered_by: string;
  patient_code: string;
}): Promise<{ id: string }> {
  const { data: existing } = await admin
    .from("patients")
    .select("id")
    .eq("patient_code", input.patient_code)
    .maybeSingle();
  if (existing) {
    console.log(`[patients] exists  ${input.full_name} (${input.patient_code})`);
    return existing as unknown as { id: string };
  }

  const { data, error } = await admin.from("patients").insert(input).select("id").single();
  if (error) throw error;
  console.log(`[patients] created ${input.full_name} (${input.patient_code})`);
  await writeAudit(input.registered_by, "INSERT_PATIENT", "patients", data.id);
  return { id: data.id };
}

async function ensureMedicalRecord(record: {
  patient_id: string;
  author_id: string;
  visit_date: string;
  diagnosis: string;
  notes: string;
}): Promise<void> {
  const { data: dupe } = await admin
    .from("medical_records")
    .select("id")
    .eq("patient_id", record.patient_id)
    .eq("visit_date", record.visit_date)
    .maybeSingle();
  if (dupe) {
    console.log(`[records]  exists  ${record.visit_date}`);
    return;
  }
  const { data, error } = await admin.from("medical_records").insert(record).select("id").single();
  if (error) throw error;
  console.log(`[records]  created ${record.visit_date}`);
  await writeAudit(record.author_id, "INSERT_MEDICAL_RECORD", "medical_records", data.id);
}

async function ensureAppointment(appt: {
  patient_id: string;
  staff_id: string;
  scheduled_by: string;
  date_time: string;
  status: "scheduled" | "completed";
  reason: string;
}): Promise<void> {
  const { data: dupe } = await admin
    .from("appointments")
    .select("id")
    .eq("patient_id", appt.patient_id)
    .eq("date_time", appt.date_time)
    .maybeSingle();
  if (dupe) {
    console.log(`[appts]    exists  ${appt.date_time} (${appt.status})`);
    return;
  }
  const { data, error } = await admin.from("appointments").insert(appt).select("id").single();
  if (error) throw error;
  console.log(`[appts]    created ${appt.date_time} (${appt.status})`);
  await writeAudit(appt.scheduled_by, "INSERT_APPOINTMENT", "appointments", data.id);
}

async function main(): Promise<void> {
  // Preflight: the migration must be applied before seeding.
  // NOTE: deliberately NOT a head:true request — PostgREST answers HEAD with
  // 204 No Content even when the table is missing (HTTP 404 only surfaces on GET).
  const probe = await admin.from("profiles").select("id").limit(1);
  if (probe.error) {
    console.error(
      `\n✖ Cannot query \`profiles\`: ${probe.error.message}\n` +
        `  → Apply the migration first: paste supabase/migrations/20260827000000_init_praams.sql\n` +
        `    into the Supabase Dashboard → SQL Editor → Run, then re-run this script.\n`,
    );
    process.exit(1);
  }

  console.log("Seeding PRAAMS demo data…\n");

  const profiles = new Map<string, StaffProfile>();
  for (const member of STAFF) {
    profiles.set(member.email, await ensureStaffUser(member));
  }
  const receptionist = profiles.get("liya.bekele@praams.clinic")!;
  const doctor = profiles.get("dr.kassa@praams.clinic")!;

  const abebe = await ensurePatient({
    full_name: "Abebe Kebede",
    date_of_birth: "1985-07-04",
    gender: "male",
    phone: "+251911401701",
    address: "Bole, Addis Ababa",
    emergency_contact: "Tigist Kebede +251911401702",
    registered_by: receptionist.id,
    patient_code: "P-0231",
  });

  const selam = await ensurePatient({
    full_name: "Selam Tesfaye",
    date_of_birth: "1990-03-12",
    gender: "female",
    phone: "+251911402002",
    address: "Kirkos, Addis Ababa",
    emergency_contact: "Yonas Tesfaye +251911402003",
    registered_by: receptionist.id,
    patient_code: "P-0198",
  });

  await ensureMedicalRecord({
    patient_id: selam.id,
    author_id: doctor.id,
    visit_date: "2026-05-14T10:15:00+03:00",
    diagnosis: "Initial consultation — acute pharyngitis",
    notes:
      "Presented with sore throat and low-grade fever for three days. Throat swab negative for strep. Symptomatic treatment prescribed.",
  });
  await ensureMedicalRecord({
    patient_id: selam.id,
    author_id: doctor.id,
    visit_date: "2026-07-02T09:45:00+03:00",
    diagnosis: "Follow-up — pharyngitis resolved",
    notes:
      "Symptoms fully resolved. No complications observed. Advised to return only if symptoms recur.",
  });

  // One upcoming slot, tomorrow ~09:30 Addis time (UTC+3), matching §10's booking scenario.
  const tomorrow10amAddis = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  await ensureAppointment({
    patient_id: selam.id,
    staff_id: doctor.id,
    scheduled_by: receptionist.id,
    date_time: "2026-05-14T10:00:00+03:00",
    status: "completed",
    reason: "Throat pain consultation",
  });
  await ensureAppointment({
    patient_id: selam.id,
    staff_id: doctor.id,
    scheduled_by: receptionist.id,
    date_time: "2026-07-02T09:30:00+03:00",
    status: "completed",
    reason: "Follow-up review",
  });
  await ensureAppointment({
    patient_id: abebe.id,
    staff_id: doctor.id,
    scheduled_by: receptionist.id,
    date_time: `${tomorrow10amAddis}T09:30:00+03:00`,
    status: "scheduled",
    reason: "General check-up",
  });

  console.log("\nSeed complete. Demo login accounts:");
  for (const member of STAFF) {
    console.log(
      `  ${member.role.padEnd(24)} ${member.email.padEnd(34)} ${member.password}`,
    );
  }
  console.log("(Passwords exist only in Supabase Auth; keep this output private.)");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
