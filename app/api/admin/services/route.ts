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
    .select("*,service_activities(*)")
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
  const icon = optionalText(
    body && typeof body === "object" && "icon" in body ? body.icon : "",
    20,
  );
  const activities =
    body &&
    typeof body === "object" &&
    "activities" in body &&
    Array.isArray(body.activities)
      ? body.activities
      : [];

  if ("error" in title) {
    return NextResponse.json({ error: title.error }, { status: 400 });
  }
  if ("error" in description) {
    return NextResponse.json({ error: description.error }, { status: 400 });
  }

  const { data: service, error } = await auth.service
    .from("services")
    .insert({
    title: title.value,
    description: description.value,
    icon,
    active: true,
  })
    .select("id")
    .single();

  if (error || !service) {
    return NextResponse.json(
      { error: "Unable to create service." },
      { status: 500 },
    );
  }

  const activityRows = activities
    .map((activity) => optionalText(activity, 120))
    .filter(Boolean)
    .map((name) => ({
      service_id: service.id,
      name,
    }));

  if (activityRows.length) {
    await auth.service.from("service_activities").insert(activityRows);
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
  const icon = optionalText("icon" in body ? body.icon : "", 20);
  const active = "active" in body ? body.active : undefined;
  const activities = Array.isArray("activities" in body ? body.activities : null)
    ? body.activities
    : null;

  const updates: {
    title?: string;
    description?: string;
    icon?: string | null;
    active?: boolean;
  } = {};

  if (title) updates.title = title;
  if (description) updates.description = description;
  if ("icon" in body) updates.icon = icon;
  if (typeof active === "boolean") updates.active = active;

  if (!Object.keys(updates).length && !activities) {
    return NextResponse.json({ error: "No updates provided." }, { status: 400 });
  }

  if (Object.keys(updates).length) {
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
  }

  if (activities) {
    await auth.service
      .from("service_activities")
      .delete()
      .eq("service_id", id.value);

    const activityRows = activities
      .map((activity) => optionalText(activity, 120))
      .filter(Boolean)
      .map((name) => ({
        service_id: id.value,
        name,
      }));

    if (activityRows.length) {
      await auth.service.from("service_activities").insert(activityRows);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
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

  const { error } = await auth.service
    .from("services")
    .delete()
    .eq("id", id.value);

  if (error) {
    return NextResponse.json(
      { error: "Unable to delete service." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
