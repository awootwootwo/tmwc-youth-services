"use client";

import { useEffect, useState } from "react";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem("tmwc-welcome-seen")) return;
    const timer = window.setTimeout(() => setIsOpen(true), 0);

    return () => window.clearTimeout(timer);
  }, []);

  function closeModal() {
    window.sessionStorage.setItem("tmwc-welcome-seen", "true");
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="welcome-title"
        aria-modal="true"
        className="welcome-modal"
        role="dialog"
      >
        <p className="modal-icon" aria-hidden="true">
          Church
        </p>
        <h2 id="welcome-title">Welcome to Church Connect</h2>
        <p>How would you like to proceed?</p>
        <div className="modal-actions">
          <a className="primary-link" href="/login" onClick={closeModal}>
            Staff / Admin Sign In
          </a>
          <button className="secondary-button" type="button" onClick={closeModal}>
            Just Visiting
          </button>
        </div>
      </section>
    </div>
  );
}
