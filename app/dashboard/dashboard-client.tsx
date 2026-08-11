"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { REQUEST_STATUSES } from "@/lib/security";
import { defaultSiteContent } from "@/lib/services";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SiteNav } from "../landing-nav";
import type {
  Profile,
  RequestStatus,
  Service,
  ServiceRequest,
  UserRole,
} from "@/lib/supabase/types";

type DashboardResponse = {
  requests: ServiceRequest[];
  role: UserRole;
  error?: string;
};

type AdminTab = "analytics" | "requests" | "content" | "users";

type AdminService = Service & {
  service_activities?: { id: string; name: string }[];
};

type AnalyticsData = {
  summary: {
    totalRequests: number;
    pending: number;
    inProgress: number;
    completed: number;
    totalUsers: number;
    staff: number;
  };
  requestsByService: { id: string; title: string; count: number }[];
  staffPerformance: { id: string; name: string; active: number; completed: number }[];
};

export function DashboardClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [role, setRole] = useState<UserRole>("staff");
  const [message, setMessage] = useState("Loading requests...");
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<AdminTab>("analytics");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [content, setContent] = useState(defaultSiteContent);
  const [services, setServices] = useState<AdminService[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [supabase]);

  const authedFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const token = await getToken();
      if (!token) {
        router.push("/login");
        return null;
      }

      return fetch(url, {
        ...init,
        headers: {
          ...init.headers,
          authorization: `Bearer ${token}`,
        },
      });
    },
    [getToken, router],
  );

  const loadRequests = useCallback(async () => {
    const response = await authedFetch("/api/requests");
    if (!response) return;
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
  }, [authedFetch]);

  const loadAdminData = useCallback(async () => {
    const [analyticsResponse, contentResponse, servicesResponse, usersResponse] =
      await Promise.all([
        authedFetch("/api/admin/analytics"),
        authedFetch("/api/admin/content"),
        authedFetch("/api/admin/services"),
        authedFetch("/api/admin/users"),
      ]);

    if (analyticsResponse?.ok) {
      setAnalytics((await analyticsResponse.json()) as AnalyticsData);
    }
    if (contentResponse?.ok) {
      const result = (await contentResponse.json()) as {
        content: typeof defaultSiteContent;
      };
      setContent(result.content);
    }
    if (servicesResponse?.ok) {
      const result = (await servicesResponse.json()) as { services: AdminService[] };
      setServices(result.services);
    }
    if (usersResponse?.ok) {
      const result = (await usersResponse.json()) as { users: Profile[] };
      setUsers(result.users);
    }
  }, [authedFetch]);

  async function updateStatus(id: string, status: RequestStatus) {
    const response = await authedFetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response?.ok) {
      setMessage("Unable to update that request.");
      return;
    }

    await loadRequests();
    if (role === "admin") await loadAdminData();
  }

  async function updateContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await authedFetch("/api/admin/content", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        mission: formData.get("mission"),
        vision: formData.get("vision"),
      }),
    });

    setMessage(response?.ok ? "Content updated." : "Unable to update content.");
    await loadAdminData();
  }

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const activities = String(formData.get("activities") ?? "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await authedFetch("/api/admin/services", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        icon: formData.get("icon"),
        title: formData.get("title"),
        description: formData.get("description"),
        activities,
      }),
    });

    setMessage(response?.ok ? "Service added." : "Unable to add service.");
    if (response?.ok) form.reset();
    await loadAdminData();
  }

  async function updateUserRole(id: string, nextRole: UserRole) {
    const response = await authedFetch("/api/admin/users", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ id, role: nextRole }),
    });

    setMessage(response?.ok ? "User updated." : "Unable to update user.");
    await loadAdminData();
  }

  async function inviteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await authedFetch("/api/admin/users", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        display_name: formData.get("display_name"),
        email: formData.get("email"),
        role: formData.get("role"),
      }),
    });

    setMessage(response?.ok ? "User invited." : "Unable to invite user.");
    if (response?.ok) form.reset();
    await loadAdminData();
  }

  async function removeUser(id: string) {
    const confirmed = window.confirm("Remove this user?");
    if (!confirmed) return;

    const response = await authedFetch("/api/admin/users", {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    setMessage(response?.ok ? "User removed." : "Unable to remove user.");
    await loadAdminData();
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRequests();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRequests]);

  useEffect(() => {
    if (role !== "admin" || isLoading) return;
    const timer = window.setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isLoading, loadAdminData, role]);

  return (
    <main className="site-shell dashboard-shell">
      <header className="site-header">
        <a className="brand text-brand" href="/">
          Church Connect
        </a>
        <SiteNav />
      </header>

      <section className="content-section admin-dashboard">
        <div className="section-heading">
          <p className="eyebrow">{role === "admin" ? "Admin" : "Staff"}</p>
          <h1>{role === "admin" ? "Admin Dashboard" : "Staff Dashboard"}</h1>
        </div>

        {role === "admin" ? (
          <div className="tab-list" role="tablist" aria-label="Admin dashboard">
            {(["analytics", "requests", "content", "users"] as AdminTab[]).map(
              (item) => (
                <button
                  className={tab === item ? "tab-button active" : "tab-button"}
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                >
                  {item}
                </button>
              ),
            )}
            <button type="button" onClick={() => void loadAdminData()}>
              Refresh
            </button>
          </div>
        ) : null}

        {message ? <p className="form-message">{message}</p> : null}

        {role === "admin" && tab === "analytics" ? (
          <AnalyticsPanel analytics={analytics} />
        ) : null}

        {(role !== "admin" || tab === "requests") ? (
          <RequestsPanel requests={requests} onUpdateStatus={updateStatus} />
        ) : null}

        {role === "admin" && tab === "content" ? (
          <ContentPanel
            content={content}
            services={services}
            onCreateService={createService}
            onUpdateContent={updateContent}
          />
        ) : null}

        {role === "admin" && tab === "users" ? (
          <UsersPanel
            users={users}
            onInviteUser={inviteUser}
            onRemoveUser={removeUser}
            onUpdateUserRole={updateUserRole}
          />
        ) : null}
      </section>
    </main>
  );
}

function AnalyticsPanel({ analytics }: { analytics: AnalyticsData | null }) {
  const summary = analytics?.summary;
  const maxServiceCount = Math.max(
    1,
    ...(analytics?.requestsByService.map((item) => item.count) ?? [0]),
  );

  return (
    <>
      <div className="metric-grid">
        {[
          ["Total Requests", summary?.totalRequests ?? 0],
          ["Pending", summary?.pending ?? 0],
          ["In Progress", summary?.inProgress ?? 0],
          ["Completed", summary?.completed ?? 0],
          ["Total Users", summary?.totalUsers ?? 0],
          ["Staff", summary?.staff ?? 0],
        ].map(([label, value]) => (
          <article className="panel metric-card" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>

      <article className="panel analytics-panel">
        <h2>Requests by service</h2>
        {(analytics?.requestsByService ?? []).map((item) => (
          <div className="bar-row" key={item.id}>
            <span>{item.title}</span>
            <div>
              <span style={{ width: `${(item.count / maxServiceCount) * 100}%` }} />
            </div>
            <strong>{item.count}</strong>
          </div>
        ))}
      </article>

      <article className="panel analytics-panel">
        <h2>Staff performance</h2>
        <table>
          <thead>
            <tr>
              <th>Staff</th>
              <th>Active</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {(analytics?.staffPerformance ?? []).map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.active}</td>
                <td>{item.completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}

function RequestsPanel({
  requests,
  onUpdateStatus,
}: {
  requests: ServiceRequest[];
  onUpdateStatus: (id: string, status: RequestStatus) => void;
}) {
  if (!requests.length) {
    return (
      <article className="panel">
        <h2>No requests yet</h2>
        <p>New guest requests will appear here once submitted.</p>
      </article>
    );
  }

  return (
    <div className="request-list">
      {requests.map((request) => (
        <article className="panel request-card" key={request.id}>
          <div>
            <p className="eyebrow">
              {request.services?.icon ? `${request.services.icon} ` : ""}
              {request.services?.title ?? "Service"}
            </p>
            <h2>{request.guest_name}</h2>
            <p>{request.guest_contact}</p>
          </div>
          <dl>
            <div>
              <dt>Activity</dt>
              <dd>{request.service_activities?.name || "Not selected"}</dd>
            </div>
            <div>
              <dt>Preferred date/time</dt>
              <dd>
                {[request.preferred_date, request.preferred_time]
                  .filter(Boolean)
                  .join(" ") || "Not provided"}
              </dd>
            </div>
            <div>
              <dt>Budget</dt>
              <dd>{request.budget || "Not provided"}</dd>
            </div>
          </dl>
          <label>
            Status
            <select
              value={request.status}
              onChange={(event) =>
                onUpdateStatus(
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
  );
}

function ContentPanel({
  content,
  services,
  onCreateService,
  onUpdateContent,
}: {
  content: typeof defaultSiteContent;
  services: AdminService[];
  onCreateService: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateContent: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <form className="request-form" onSubmit={onCreateService}>
        <h2>Add service</h2>
        <label>
          Icon
          <input name="icon" maxLength={20} placeholder="🎨" />
        </label>
        <label>
          Name
          <input name="title" required maxLength={120} />
        </label>
        <label>
          Description
          <textarea name="description" required maxLength={800} rows={3} />
        </label>
        <label>
          Activities
          <textarea
            name="activities"
            maxLength={800}
            rows={5}
            placeholder={"One activity per line"}
          />
        </label>
        <button type="submit">Add service</button>
      </form>

      <form className="request-form" onSubmit={() => undefined}>
        <h2>Services offered</h2>
        {services.length ? (
          services.map((service) => (
            <article className="nested-panel" key={service.id}>
              <h3>
                {service.icon ? `${service.icon} ` : ""}
                {service.title}
              </h3>
              <p>{service.description}</p>
              <p>
                {(service.service_activities ?? [])
                  .map((activity) => activity.name)
                  .join(", ") || "No activities yet"}
              </p>
            </article>
          ))
        ) : (
          <p>No services available at the moment.</p>
        )}
      </form>

      <form className="request-form" onSubmit={onUpdateContent}>
        <h2>Mission statement</h2>
        <textarea name="mission" defaultValue={content.mission} rows={4} />
        <h2>Vision statement</h2>
        <textarea name="vision" defaultValue={content.vision} rows={4} />
        <button type="submit">Save content</button>
      </form>
    </>
  );
}

function UsersPanel({
  users,
  onInviteUser,
  onRemoveUser,
  onUpdateUserRole,
}: {
  users: Profile[];
  onInviteUser: (event: FormEvent<HTMLFormElement>) => void;
  onRemoveUser: (id: string) => void;
  onUpdateUserRole: (id: string, role: UserRole) => void;
}) {
  return (
    <>
      <form className="request-form compact-form" onSubmit={onInviteUser}>
        <h2>Create user</h2>
        <label>
          Name
          <input name="display_name" maxLength={120} />
        </label>
        <label>
          Email
          <input name="email" type="email" required maxLength={180} />
        </label>
        <label>
          Role
          <select name="role" defaultValue="staff">
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit">Create user</button>
      </form>

      <article className="panel analytics-panel">
        <h2>Users</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.display_name || "Unnamed"}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(event) =>
                      onUpdateUserRole(
                        user.id,
                        event.currentTarget.value as UserRole,
                      )
                    }
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => onRemoveUser(user.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </>
  );
}
