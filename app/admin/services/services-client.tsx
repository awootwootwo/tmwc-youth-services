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
    const token = await getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
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

  async function updateService(service: Service, active: boolean) {
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
        active,
      }),
    });

    if (!response.ok) {
      setMessage("Unable to update service.");
      return;
    }

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
          <p>Add new services and hide offerings that are not ready yet.</p>
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
          {services.map((service) => (
            <article className="panel service-admin-card" key={service.id}>
              <div>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
              </div>
              <button
                type="button"
                onClick={() => void updateService(service, !service.active)}
              >
                {service.active ? "Hide service" : "Publish service"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
