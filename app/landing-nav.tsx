"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { UserRole } from "@/lib/supabase/types";

type SessionState = {
  name: string;
  role: UserRole;
};

export function SiteNav() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSessionState() {
      const { data } = (await supabase?.auth.getSession()) ?? { data: null };
      const token = data?.session?.access_token;

      if (!token) {
        if (isMounted) {
          setSessionState(null);
          setIsCheckingSession(false);
        }
        return;
      }

      const response = await fetch("/api/requests", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }).catch(() => null);

      if (!response?.ok) {
        if (isMounted) {
          setSessionState(null);
          setIsCheckingSession(false);
        }
        return;
      }

      const result = (await response.json()) as {
        profile?: { display_name: string | null; email: string };
        role: UserRole;
      };
      const emailName = result.profile?.email?.split("@")[0] ?? "Staff";

      if (isMounted) {
        setSessionState({
          name: result.profile?.display_name || emailName,
          role: result.role,
        });
        setIsCheckingSession(false);
      }
    }

    void loadSessionState();

    const subscription = supabase?.auth.onAuthStateChange(() => {
      void loadSessionState();
    });

    return () => {
      isMounted = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase?.auth.signOut();
    setSessionState(null);
    setIsCheckingSession(false);
    router.refresh();
  }

  return (
    <nav aria-label="Primary navigation">
      <a href={pathname === "/" ? "#home" : "/"}>Home</a>
      <a href="/request">Request Service</a>
      <span className="nav-session-slot">
        {isCheckingSession ? (
          <>
            <span className="nav-placeholder">Admin</span>
            <span className="nav-user nav-placeholder">Staff Member</span>
            <span className="nav-button nav-placeholder">Logout</span>
          </>
        ) : sessionState ? (
          <>
          <a href="/dashboard">
            {sessionState.role === "admin" ? "Admin" : "Staff"}
          </a>
          <span className="nav-user">{sessionState.name}</span>
          <button
            className="nav-button nav-logout"
            type="button"
            onClick={signOut}
          >
            Logout
          </button>
          </>
        ) : (
          <a className="nav-sign-in" href="/login">
            Sign In
          </a>
        )}
      </span>
    </nav>
  );
}
