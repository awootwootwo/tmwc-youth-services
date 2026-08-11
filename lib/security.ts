import type { RequestStatus } from "./supabase/types";

const MAX_TEXT_LENGTH = 800;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export const REQUEST_STATUSES: RequestStatus[] = [
  "pending",
  "in_progress",
  "declined",
  "completed",
];

export function sanitizeText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== "string") return "";

  return value
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? " " : char;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function requiredText(
  value: unknown,
  label: string,
  maxLength = MAX_TEXT_LENGTH,
) {
  const text = sanitizeText(value, maxLength);
  if (!text) return { error: `${label} is required.` };

  return { value: text };
}

export function optionalText(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  const text = sanitizeText(value, maxLength);
  return text || null;
}

export function validateStatus(value: unknown) {
  return REQUEST_STATUSES.includes(value as RequestStatus)
    ? (value as RequestStatus)
    : null;
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export function checkRateLimit(key: string) {
  const now = Date.now();
  const bucket = requestBuckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    requestBuckets.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (bucket.count >= RATE_LIMIT_MAX) return false;

  bucket.count += 1;
  return true;
}
