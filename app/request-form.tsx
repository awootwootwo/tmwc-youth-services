"use client";

import { FormEvent, useMemo, useState } from "react";

type ServiceOption = {
  id: string;
  title: string;
  icon?: string | null;
  service_activities?: { id: string; name: string }[];
};

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function RequestForm({ services }: { services: ServiceOption[] }) {
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(
    services[0]?.id ?? "",
  );
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const hasServices = services.length > 0;

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId),
    [selectedServiceId, services],
  );
  const activities = selectedService?.service_activities ?? [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasServices) {
      setState({
        status: "error",
        message: "No services are available for requests right now.",
      });
      return;
    }

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
        activity_id: formData.get("activity_id"),
        guest_name: formData.get("guest_name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        messenger_name: formData.get("messenger_name"),
        preferred_date: formData.get("preferred_date"),
        preferred_time: formData.get("preferred_time"),
        budget: formData.get("budget"),
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
    setSelectedServiceId(services[0]?.id ?? "");
    setSelectedActivityId("");
    setState({
      status: "success",
      message: "Request sent. The team can now review and respond.",
    });
    setIsSubmitting(false);
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <label>
        Service *
        <select
          name="service_id"
          required
          value={selectedServiceId}
          disabled={!hasServices}
          onChange={(event) => {
            setSelectedServiceId(event.currentTarget.value);
            setSelectedActivityId("");
          }}
        >
          {!hasServices ? (
            <option value="">No services available</option>
          ) : null}
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.icon ? `${service.icon} ` : ""}
              {service.title}
            </option>
          ))}
        </select>
      </label>

      {activities.length > 0 ? (
        <fieldset className="activity-picker">
          <legend>Select activity (optional)</legend>
          <input name="activity_id" type="hidden" value={selectedActivityId} />
          <div className="activity-options">
            {activities.map((activity) => (
              <button
                className={
                  selectedActivityId === activity.id
                    ? "activity-chip active"
                    : "activity-chip"
                }
                key={activity.id}
                type="button"
                onClick={() =>
                  setSelectedActivityId((current) =>
                    current === activity.id ? "" : activity.id,
                  )
                }
              >
                {activity.name}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label>
        Your name *
        <input
          name="guest_name"
          required
          maxLength={120}
          autoComplete="name"
          placeholder="Full name"
        />
      </label>

      <label>
        Phone
        <input
          name="phone"
          maxLength={80}
          autoComplete="tel"
          placeholder="Phone number"
        />
      </label>

      <label>
        Email
        <input
          name="email"
          type="email"
          maxLength={180}
          autoComplete="email"
          placeholder="Email address"
        />
      </label>

      <label>
        Messenger name
        <input
          name="messenger_name"
          maxLength={120}
          placeholder="Messenger / social handle"
        />
      </label>

      <label>
        Preferred date
        <input name="preferred_date" type="date" />
      </label>

      <label>
        Preferred time
        <input name="preferred_time" type="time" />
      </label>

      <label>
        Budget / willingness to pay
        <input name="budget" maxLength={120} placeholder="e.g. ₱500, Free, Negotiable" />
      </label>

      <label className="consent-row">
        <input name="consent" type="checkbox" required />
        <span>
          I agree that TMWC Youth may use my contact information to respond to
          this service request.
        </span>
      </label>

      {!hasServices ? (
        <p className="form-message error">
          No services available at the moment.
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting || !hasServices}>
        {isSubmitting ? "Sending..." : "Submit request"}
      </button>

      {state.message ? (
        <p className={`form-message ${state.status}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
