"use client";

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
      <a className="secondary-link" href="/">
        Go home
      </a>
      <a className="secondary-link" href="/login">
        Staff sign in
      </a>
    </div>
  );
}
