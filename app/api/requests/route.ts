import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  optionalText,
  requiredText,
} from "@/lib/security";
import {
  createSupabaseAnonClient,
  isAdmin,
  requireProfileFromBearer,
} from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireProfileFromBearer(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let query = auth.service
    .from("service_requests")
    .select(
      "id,service_id,guest_name,guest_contact,preferred_time,notes,budget,status,created_at,updated_at,services(title)",
    )
    .order("created_at", { ascending: false });

  if (!isAdmin(auth.profile)) {
    query = query.in(
      "service_id",
      (
        await auth.service
          .from("staff_service_assignments")
          .select("service_id")
          .eq("staff_id", auth.profile.id)
      ).data?.map((row) => row.service_id) ?? [],
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Unable to load requests." },
      { status: 500 },
    );
  }

  return NextResponse.json({ requests: data ?? [], role: auth.profile.role });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`request:${ip}`)) {
    return NextResponse.json(
      { error: "Please wait before sending another request." },
      { status: 429 },
    );
  }

  const supabase = createSupabaseAnonClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const serviceId = requiredText("service_id" in body ? body.service_id : "", "Service", 120);
  const guestName = requiredText("guest_name" in body ? body.guest_name : "", "Name", 120);
  const guestContact = requiredText(
    "guest_contact" in body ? body.guest_contact : "",
    "Contact information",
    180,
  );
  const consent = "consent" in body ? body.consent : false;

  if ("error" in serviceId) {
    return NextResponse.json({ error: serviceId.error }, { status: 400 });
  }
  if ("error" in guestName) {
    return NextResponse.json({ error: guestName.error }, { status: 400 });
  }
  if ("error" in guestContact) {
    return NextResponse.json({ error: guestContact.error }, { status: 400 });
  }
  if (consent !== true) {
    return NextResponse.json(
      { error: "Please agree to be contacted about this request." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("service_requests").insert({
    service_id: serviceId.value,
    guest_name: guestName.value,
    guest_contact: guestContact.value,
    preferred_time: optionalText("preferred_time" in body ? body.preferred_time : "", 180),
    notes: optionalText("notes" in body ? body.notes : ""),
    budget: optionalText("budget" in body ? body.budget : "", 120),
  });

  if (error) {
    return NextResponse.json(
      { error: "Unable to send request. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
