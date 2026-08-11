import { NextResponse } from "next/server";
import { defaultSiteContent } from "@/lib/services";
import { requiredText } from "@/lib/security";
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
    .from("site_content")
    .select("key,value");

  if (error) {
    return NextResponse.json(
      { error: "Unable to load content." },
      { status: 500 },
    );
  }

  const content = (data ?? []).reduce(
    (result, item) => ({
      ...result,
      [item.key]: item.value,
    }),
    defaultSiteContent,
  );

  return NextResponse.json({ content });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => null);
  const mission = requiredText(
    body && typeof body === "object" && "mission" in body ? body.mission : "",
    "Mission",
    1600,
  );
  const vision = requiredText(
    body && typeof body === "object" && "vision" in body ? body.vision : "",
    "Vision",
    1600,
  );

  if ("error" in mission) {
    return NextResponse.json({ error: mission.error }, { status: 400 });
  }
  if ("error" in vision) {
    return NextResponse.json({ error: vision.error }, { status: 400 });
  }

  const { error } = await auth.service.from("site_content").upsert([
    { key: "mission", value: mission.value, updated_at: new Date().toISOString() },
    { key: "vision", value: vision.value, updated_at: new Date().toISOString() },
  ]);

  if (error) {
    return NextResponse.json(
      { error: "Unable to update content." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
