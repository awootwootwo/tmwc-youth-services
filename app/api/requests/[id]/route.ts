import { NextResponse } from "next/server";
import { validateStatus } from "@/lib/security";
import { isAdmin, requireProfileFromBearer } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireProfileFromBearer(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const status = validateStatus(
    body && typeof body === "object" && "status" in body ? body.status : null,
  );

  if (!status) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  if (!isAdmin(auth.profile)) {
    const { data: requestRow, error: requestError } = await auth.service
      .from("service_requests")
      .select("service_id")
      .eq("id", id)
      .single();

    if (requestError || !requestRow) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const { data: assignment } = await auth.service
      .from("staff_service_assignments")
      .select("service_id")
      .eq("staff_id", auth.profile.id)
      .eq("service_id", requestRow.service_id)
      .maybeSingle();

    if (!assignment) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
  }

  const { error } = await auth.service
    .from("service_requests")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Unable to update request." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
