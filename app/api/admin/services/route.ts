import { NextResponse } from "next/server";
import { optionalText, requiredText } from "@/lib/security";
import { isAdmin, requireProfileFromBearer } from "@/lib/supabase/server";

async function requireAdmin(request: Request) {
  const auth = await requireProfileFromBearer(request);
  if ("error" in auth) return auth;

  if (!isAdmin(auth.profile)) {
    return { error: "Admin access is required.", status: 403 as const };
  }

  return auth;
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await auth.service
    .from("services")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Unable to load services." },
      { status: 500 },
    );
  }

  return NextResponse.json({ services: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const title = requiredText(
    body && typeof body === "object" && "title" in body ? body.title : "",
    "Title",
    120,
  );
  const description = requiredText(
    body && typeof body === "object" && "description" in body
      ? body.description
      : "",
    "Description",
  );

  if ("error" in title) {
    return NextResponse.json({ error: title.error }, { status: 400 });
  }
  if ("error" in description) {
    return NextResponse.json({ error: description.error }, { status: 400 });
  }

  const { error } = await auth.service.from("services").insert({
    title: title.value,
    description: description.value,
    active: true,
  });

  if (error) {
    return NextResponse.json(
      { error: "Unable to create service." },
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

  const id = requiredText("id" in body ? body.id : "", "Service ID", 120);
  if ("error" in id) {
    return NextResponse.json({ error: id.error }, { status: 400 });
  }

  const title = optionalText("title" in body ? body.title : "", 120);
  const description = optionalText("description" in body ? body.description : "");
  const active = "active" in body ? body.active : undefined;

  const updates: {
    title?: string;
    description?: string;
    active?: boolean;
  } = {};

  if (title) updates.title = title;
  if (description) updates.description = description;
  if (typeof active === "boolean") updates.active = active;

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No updates provided." }, { status: 400 });
  }

  const { error } = await auth.service
    .from("services")
    .update(updates)
    .eq("id", id.value);

  if (error) {
    return NextResponse.json(
      { error: "Unable to update service." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
