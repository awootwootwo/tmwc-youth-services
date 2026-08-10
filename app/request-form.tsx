"use client";

import { FormEvent, useState } from "react";

type ServiceOption = {
  id: string;
  title: string;
};

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function RequestForm({ services }: { services: ServiceOption[] }) {
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setState({ status: "idle", message: "" });

    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        service_id: formData.get("service_id"),
        guest_name: formData.get("guest_name"),
        guest_contact: formData.get("guest_contact"),
        preferred_time: formData.get("preferred_time"),
        budget: formData.get("budget"),
        notes: formData.get("notes"),
        consent: formData.get("consent") === "on",
      }),
    });

    const result = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setState({
        status: "error",
        message: result?.error ?? "Unable to send request right now.",
      });
      setIsSubmitting(false);
      return;
    }

    form.reset();
    setState({
      status: "success",
      message: "Request sent. The team can now review and respond.",
    });
    setIsSubmitting(false);
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <label>
        Service
        <select name="service_id" required defaultValue="">
          <option value="" disabled>
            Choose a service
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title}
            </option>
          ))}
        </select>
      </label>

      <label>
        Name
        <input name="guest_name" required maxLength={120} autoComplete="name" />
      </label>

      <label>
        Contact information
        <input
          name="guest_contact"
          required
          maxLength={180}
          autoComplete="email"
          placeholder="Phone, email, or Messenger name"
        />
      </label>

      <label>
        Preferred date or time
        <input name="preferred_time" maxLength={180} />
      </label>

      <label>
        Budget or willingness to pay
        <input name="budget" maxLength={120} placeholder="Optional" />
      </label>

      <label>
        Notes
        <textarea name="notes" maxLength={800} rows={5} />
      </label>

      <label className="consent-row">
        <input name="consent" type="checkbox" required />
        <span>
          I agree that TMWC Youth may use my contact information to respond to
          this service request.
        </span>
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send request"}
      </button>

      {state.message ? (
        <p className={`form-message ${state.status}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
