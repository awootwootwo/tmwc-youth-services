"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function redirectSignedInUser() {
      const { data } = (await supabase?.auth.getSession()) ?? { data: null };
      if (isMounted && data?.session) {
        router.replace("/dashboard");
      }
    }

    void redirectSignedInUser();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setMessage("Unable to send a sign-in link to that email.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Check your email for the sign-in link.");
    setIsSubmitting(false);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending link..." : "Send sign-in link"}
      </button>
      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}
