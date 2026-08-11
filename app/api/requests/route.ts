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
      "id,service_id,activity_id,assigned_staff_id,guest_name,guest_contact,phone,email,messenger_name,preferred_date,preferred_time,notes,budget,status,created_at,updated_at,services(title,icon),service_activities(name),profiles(display_name,email)",
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

  return NextResponse.json({
    requests: data ?? [],
    role: auth.profile.role,
    profile: {
      display_name: auth.profile.display_name,
      email: auth.profile.email,
    },
  });
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

  const serviceId = requiredText(
    "service_id" in body ? body.service_id : "",
    "Service",
    120,
  );
  const guestName = requiredText(
    "guest_name" in body ? body.guest_name : "",
    "Name",
    120,
  );
  const phone = optionalText("phone" in body ? body.phone : "", 80);
  const email = optionalText("email" in body ? body.email : "", 180);
  const messengerName = optionalText(
    "messenger_name" in body ? body.messenger_name : "",
    120,
  );
  const guestContact = [phone, email, messengerName].filter(Boolean).join(" / ");
  const consent = "consent" in body ? body.consent : false;

  if ("error" in serviceId) {
    return NextResponse.json({ error: serviceId.error }, { status: 400 });
  }
  if ("error" in guestName) {
    return NextResponse.json({ error: guestName.error }, { status: 400 });
  }
  if (!guestContact) {
    return NextResponse.json(
      { error: "Please provide phone, email, or Messenger name." },
      { status: 400 },
    );
  }
  if (consent !== true) {
    return NextResponse.json(
      { error: "Please agree to be contacted about this request." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("service_requests").insert({
    service_id: serviceId.value,
    activity_id: optionalText("activity_id" in body ? body.activity_id : "", 120),
    guest_name: guestName.value,
    guest_contact: guestContact,
    phone,
    email,
    messenger_name: messengerName,
    preferred_date: optionalText("preferred_date" in body ? body.preferred_date : "", 20),
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
