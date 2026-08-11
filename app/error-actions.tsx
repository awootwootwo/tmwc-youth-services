"use client";

import Link from "next/link";

type ErrorActionsProps = {
  reset?: () => void;
};

export function ErrorActions({ reset }: ErrorActionsProps) {
  return (
    <div className="hero-actions">
      {reset ? (
        <button type="button" onClick={reset}>
          Try again
        </button>
      ) : null}
      <Link className="secondary-link" href="/">
        Go home
      </Link>
      <Link className="secondary-link" href="/login">
        Staff sign in
      </Link>
    </div>
  );
}
