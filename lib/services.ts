import { createSupabaseAnonClient } from "./supabase/server";

export const defaultSiteContent = {
  mission:
    "We exist to serve our community by providing meaningful services that enrich lives, foster creativity, expand knowledge, and build lasting connections.",
  vision:
    "To create a thriving community where faith and service walk hand in hand, empowering people to reach their fullest potential.",
};

export async function listActiveServices() {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("services")
    .select("id,title,description,icon,service_activities(id,name)")
    .eq("active", true)
    .order("title", { ascending: true });

  if (error) return [];

  return data ?? [];
}

export async function getSiteContent() {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return defaultSiteContent;

  const { data, error } = await supabase
    .from("site_content")
    .select("key,value");

  if (error || !data?.length) return defaultSiteContent;

  return data.reduce(
    (content, item) => ({
      ...content,
      [item.key]: item.value,
    }),
    defaultSiteContent,
  );
}
