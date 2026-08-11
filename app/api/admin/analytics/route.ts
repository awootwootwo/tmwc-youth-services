import { NextResponse } from "next/server";
import { isAdmin, requireProfileFromBearer } from "@/lib/supabase/server";
import type { Profile, Service, ServiceRequest } from "@/lib/supabase/types";

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

  const [requestsResult, profilesResult, servicesResult] = await Promise.all([
    auth.service
      .from("service_requests")
      .select("id,status,service_id,assigned_staff_id,services(title),profiles(display_name,email)"),
    auth.service.from("profiles").select("*"),
    auth.service.from("services").select("id,title"),
  ]);

  if (requestsResult.error || profilesResult.error || servicesResult.error) {
    return NextResponse.json(
      { error: "Unable to load analytics." },
      { status: 500 },
    );
  }

  const requests = (requestsResult.data ?? []) as ServiceRequest[];
  const profiles = (profilesResult.data ?? []) as Profile[];
  const services = (servicesResult.data ?? []) as Pick<Service, "id" | "title">[];

  const requestsByService = services.map((service) => ({
    id: service.id,
    title: service.title,
    count: requests.filter((item) => item.service_id === service.id).length,
  }));

  const staffPerformance = profiles
    .filter((profile) => profile.role === "staff")
    .map((profile) => ({
      id: profile.id,
      name: profile.display_name ?? profile.email,
      active: requests.filter(
        (requestItem) =>
          requestItem.assigned_staff_id === profile.id &&
          requestItem.status !== "completed",
      ).length,
      completed: requests.filter(
        (requestItem) =>
          requestItem.assigned_staff_id === profile.id &&
          requestItem.status === "completed",
      ).length,
    }));

  return NextResponse.json({
    summary: {
      totalRequests: requests.length,
      pending: requests.filter((item) => item.status === "pending").length,
      inProgress: requests.filter((item) => item.status === "in_progress").length,
      completed: requests.filter((item) => item.status === "completed").length,
      totalUsers: profiles.length,
      staff: profiles.filter((item) => item.role === "staff").length,
    },
    requestsByService,
    staffPerformance,
  });
}
