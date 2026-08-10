"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { REQUEST_STATUSES } from "@/lib/security";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { RequestStatus, ServiceRequest, UserRole } from "@/lib/supabase/types";

type DashboardResponse = {
  requests: ServiceRequest[];
  role: UserRole;
  error?: string;
};

export function DashboardClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [role, setRole] = useState<UserRole>("staff");
  const [message, setMessage] = useState("Loading requests...");
  const [isLoading, setIsLoading] = useState(true);

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [supabase]);

  const loadRequests = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch("/api/requests", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const result = (await response.json().catch(() => null)) as
      | DashboardResponse
      | null;

    if (!response.ok || !result) {
      setMessage(result?.error ?? "Unable to load requests.");
      setIsLoading(false);
      return;
    }

    setRequests(result.requests);
    setRole(result.role);
    setMessage("");
    setIsLoading(false);
  }, [getToken, router]);

  async function updateStatus(id: string, status: RequestStatus) {
    const token = await getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setMessage("Unable to update that request.");
      return;
    }

    await loadRequests();
  }

  async function signOut() {
    await supabase?.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRequests();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRequests]);

  return (
    <main className="site-shell dashboard-shell">
      <header className="site-header">
        <a className="brand text-brand" href="/">
          TMWC Youth Services
        </a>
        <nav aria-label="Dashboard navigation">
          <a href="/">Home</a>
          {role === "admin" ? <a href="/admin/services">Services</a> : null}
          <button className="nav-button" type="button" onClick={signOut}>
            Sign out
          </button>
        </nav>
      </header>

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Dashboard</p>
          <h1>Service requests</h1>
          <p>
            Review incoming requests and keep their status updated as the team
            responds.
          </p>
        </div>

        {message ? <p className="form-message error">{message}</p> : null}

        {!isLoading && requests.length === 0 ? (
          <article className="panel">
            <h2>No requests yet</h2>
            <p>New guest requests will appear here once submitted.</p>
          </article>
        ) : null}

        <div className="request-list">
          {requests.map((request) => (
            <article className="panel request-card" key={request.id}>
              <div>
                <p className="eyebrow">{request.services?.title ?? "Service"}</p>
                <h2>{request.guest_name}</h2>
                <p>{request.guest_contact}</p>
              </div>
              <dl>
                <div>
                  <dt>Preferred time</dt>
                  <dd>{request.preferred_time || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Budget</dt>
                  <dd>{request.budget || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Notes</dt>
                  <dd>{request.notes || "No notes"}</dd>
                </div>
              </dl>
              <label>
                Status
                <select
                  value={request.status}
                  onChange={(event) =>
                    void updateStatus(
                      request.id,
                      event.currentTarget.value as RequestStatus,
                    )
                  }
                >
                  {REQUEST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
