import { toast } from "sonner";
import { logIncident } from "@/lib/incident";
import { reportLovableError } from "@/lib/lovable-error-reporting";

/**
 * Central mapping of backend/network failures to short, human messages.
 * Keeps every call site consistent instead of `(e as Error).message`.
 */
export function describeError(err: unknown, fallback = "Something went wrong"): string {
  const raw =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message ?? "")
      : String(err ?? "");
  const m = raw.toLowerCase();

  if (!raw) return fallback;
  if (raw === "AUTH_REQUIRED") return "Sign in to continue";
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("load failed"))
    return "No connection. Check your internet and try again";
  if (m.includes("timeout") || m.includes("timed out")) return "The server took too long. Try again";
  if (m.includes("jwt") || m.includes("token is expired") || m.includes("401"))
    return "Your session expired. Sign in again";
  if (m.includes("row-level security") || m.includes("permission denied") || m.includes("403"))
    return "You don't have permission to do that";
  if (m.includes("duplicate") || m.includes("unique")) return "That already exists";
  if (m.includes("payload too large") || m.includes("413") || m.includes("exceeded the maximum"))
    return "That file is too large";
  if (m.includes("storage") && m.includes("not found")) return "The file could not be found";
  if (m.includes("rate limit") || m.includes("429")) return "Too many attempts. Wait a moment";
  return raw.length > 160 ? fallback : raw;
}

/** Toast an error with a consistent message and a traceable incident id. */
export function toastError(err: unknown, context: string, fallback?: string): string {
  const message = describeError(err, fallback);
  const record = logIncident(err, { source: context, message });
  reportLovableError(err, { source: context }, { handled: true });
  toast.error(message, { description: `Ref ${record.id}` });
  return message;
}


/** Run an async backend call with loading/success/error toasts. */
export async function withToast<T>(
  fn: () => Promise<T>,
  opts: { loading: string; success: string; context: string; fallback?: string },
): Promise<T | undefined> {
  const tid = toast.loading(opts.loading);
  try {
    const res = await fn();
    toast.success(opts.success, { id: tid });
    return res;
  } catch (e) {
    toast.dismiss(tid);
    toastError(e, opts.context, opts.fallback);
    return undefined;
  }
}
