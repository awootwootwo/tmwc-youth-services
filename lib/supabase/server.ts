import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "./env";
import type { Database, Profile } from "./types";

export function createSupabaseAnonClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;

  return createClient<Database>(env.url, env.anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

export function createSupabaseServiceClient() {
  const env = getSupabaseServiceEnv();
  if (!env) return null;

  return createClient<Database>(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function requireProfileFromBearer(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { error: "Missing session.", status: 401 as const };

  const anon = createSupabaseAnonClient();
  const service = createSupabaseServiceClient();
  if (!anon || !service) {
    return { error: "Supabase is not configured.", status: 503 as const };
  }

  const { data: userData, error: userError } = await anon.auth.getUser(token);
  if (userError || !userData.user) {
    return { error: "Invalid session.", status: 401 as const };
  }

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) {
    return { error: "No staff profile found.", status: 403 as const };
  }

  return { profile: profile as Profile, service };
}

export function isAdmin(profile: Profile) {
  return profile.role === "admin";
}
