import { NextResponse } from "next/server";
import { optionalText, requiredText } from "@/lib/security";
import { isAdmin, requireProfileFromBearer } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

async function requireAdmin(request: Request) {
  const auth = await requireProfileFromBearer(request);
  if ("error" in auth) return auth;

  if (!isAdmin(auth.profile)) {
    return { error: "Admin access is required.", status: 403 as const };
  }

  return auth;
}

function roleFromValue(value: unknown): UserRole | null {
  return value === "admin" || value === "staff" ? value : null;
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await auth.service
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Unable to load users." }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const email = requiredText(
    body && typeof body === "object" && "email" in body ? body.email : "",
    "Email",
    180,
  );
  const displayName = optionalText(
    body && typeof body === "object" && "display_name" in body
      ? body.display_name
      : "",
    120,
  );
  const role = roleFromValue(
    body && typeof body === "object" && "role" in body ? body.role : "staff",
  );

  if ("error" in email) {
    return NextResponse.json({ error: email.error }, { status: 400 });
  }
  if (!role) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const { data: invite, error: inviteError } =
    await auth.service.auth.admin.inviteUserByEmail(email.value);

  if (inviteError || !invite.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? "Unable to invite user." },
      { status: 500 },
    );
  }

  const { error } = await auth.service.from("profiles").upsert({
    id: invite.user.id,
    email: email.value,
    display_name: displayName,
    role,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json(
      { error: "User invited, but profile could not be saved." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = requiredText("id" in body ? body.id : "", "User ID", 120);
  const role = roleFromValue("role" in body ? body.role : null);

  if ("error" in id) {
    return NextResponse.json({ error: id.error }, { status: 400 });
  }
  if (!role) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const { error } = await auth.service
    .from("profiles")
    .update({ role })
    .eq("id", id.value);

  if (error) {
    return NextResponse.json({ error: "Unable to update user." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const id = requiredText(
    body && typeof body === "object" && "id" in body ? body.id : "",
    "User ID",
    120,
  );

  if ("error" in id) {
    return NextResponse.json({ error: id.error }, { status: 400 });
  }
  if (id.value === auth.profile.id) {
    return NextResponse.json(
      { error: "You cannot remove your own admin account." },
      { status: 400 },
    );
  }

  const { error } = await auth.service.auth.admin.deleteUser(id.value);

  if (error) {
    return NextResponse.json({ error: "Unable to remove user." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
