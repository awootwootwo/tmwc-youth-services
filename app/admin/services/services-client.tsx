"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Service } from "@/lib/supabase/types";

type ServicesResponse = {
  services: Service[];
  error?: string;
};

export function ServicesClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [services, setServices] = useState<Service[]>([]);
  const [message, setMessage] = useState("Loading services...");
  const [editingId, setEditingId] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [supabase]);

  const loadServices = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch("/api/admin/services", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const result = (await response.json().catch(() => null)) as
      | ServicesResponse
      | null;

    if (!response.ok || !result) {
      setMessage(result?.error ?? "Unable to load services.");
      return;
    }

    setServices(result.services);
    setMessage("");
  }, [getToken, router]);

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const token = await getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch("/api/admin/services", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
      }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setMessage(result?.error ?? "Unable to create service.");
      return;
    }

    form.reset();
    await loadServices();
  }

  async function saveService(event: FormEvent<HTMLFormElement>, service: Service) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const token = await getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        id: service.id,
        title: formData.get("title"),
        description: formData.get("description"),
      }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setMessage(result?.error ?? "Unable to update service.");
      return;
    }

    setEditingId(null);
    await loadServices();
  }

  async function toggleService(service: Service) {
    await updateService(service, { active: !service.active });
  }

  async function updateService(
    service: Service,
    updates: Pick<Service, "active">,
  ) {
    const token = await getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        id: service.id,
        ...updates,
      }),
    });

    if (!response.ok) {
      setMessage("Unable to update service.");
      return;
    }

    await loadServices();
  }

  async function deleteService(service: Service) {
    const confirmed = window.confirm(
      `Delete "${service.title}"? Requests already linked to this service may prevent deletion.`,
    );
    if (!confirmed) return;

    const token = await getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch("/api/admin/services", {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        id: service.id,
      }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setMessage(result?.error ?? "Unable to delete service.");
      return;
    }

    if (editingId === service.id) setEditingId(null);
    await loadServices();
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadServices();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadServices]);

  return (
    <main className="site-shell dashboard-shell">
      <header className="site-header">
        <Link className="brand text-brand" href="/">
          TMWC Youth Services
        </Link>
        <nav aria-label="Admin navigation">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Requests</Link>
        </nav>
      </header>

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Admin</p>
          <h1>Manage services</h1>
          <p>Create, update, publish, hide, and delete service offerings.</p>
        </div>

        <form className="request-form compact-form" onSubmit={createService}>
          <label>
            Service title
            <input name="title" required maxLength={120} />
          </label>
          <label>
            Description
            <textarea name="description" required maxLength={800} rows={4} />
          </label>
          <button type="submit">Add service</button>
        </form>

        {message ? <p className="form-message error">{message}</p> : null}

        <div className="service-admin-list">
          {services.map((service) => {
            const isEditing = editingId === service.id;

            return (
              <article className="panel service-admin-card" key={service.id}>
                {isEditing ? (
                  <form
                    className="service-edit-form"
                    onSubmit={(event) => void saveService(event, service)}
                  >
                    <label>
                      Service title
                      <input
                        name="title"
                        required
                        maxLength={120}
                        defaultValue={service.title}
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        name="description"
                        required
                        maxLength={800}
                        rows={4}
                        defaultValue={service.description}
                      />
                    </label>
                    <div className="service-card-actions">
                      <button type="submit">Save changes</button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <p className="eyebrow">
                        {service.active ? "Published" : "Hidden"}
                      </p>
                      <h2>{service.title}</h2>
                      <p>{service.description}</p>
                    </div>
                    <div className="service-card-actions">
                      <button
                        type="button"
                        onClick={() => setEditingId(service.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => void toggleService(service)}
                      >
                        {service.active ? "Hide" : "Publish"}
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => void deleteService(service)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
