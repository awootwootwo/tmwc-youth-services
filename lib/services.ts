import { createSupabaseAnonClient } from "./supabase/server";
import type { Service } from "./supabase/types";

export const fallbackServices: Pick<Service, "id" | "title" | "description">[] =
  [
    {
      id: "community-help",
      title: "Community Help",
      description:
        "Practical support projects for people who need encouragement, assistance, or a helpful hand.",
    },
    {
      id: "youth-service-ideas",
      title: "Youth Service Ideas",
      description:
        "Small youth-led service concepts that teach stewardship, responsibility, and care for others.",
    },
    {
      id: "church-support",
      title: "Church Support",
      description:
        "Volunteer work that supports ministry, events, outreach, and the everyday needs of the church family.",
    },
  ];

export async function listActiveServices() {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return fallbackServices;

  const { data, error } = await supabase
    .from("services")
    .select("id,title,description")
    .eq("active", true)
    .order("title", { ascending: true });

  if (error || !data?.length) return fallbackServices;

  return data;
}
