/**
 * Button-press tracing.
 *
 * Disabled by default. Flip ENABLED to true to log presses to the console, and
 * set VITE_DEBUG_TO_SERVER=true to also POST them to the server — which is how
 * you see activity from a phone that has no devtools. The receiving endpoint
 * (/api/debug/press) is commented out in server/src/index.ts, so uncomment it
 * there too before using the server option.
 *
 * Call sites are left in place throughout the components; this switch is the
 * only thing that needs changing.
 */
const ENABLED = false;
const TO_SERVER = import.meta.env.VITE_DEBUG_TO_SERVER === "true";

export function logPress(action: string, detail?: Record<string, unknown>) {
  if (!ENABLED) return;

  console.log(`[press] ${action}`, detail ?? "");

  if (!TO_SERVER) return;

  // Fire-and-forget: a failed log must never break the interaction
  void fetch("/api/debug/press", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, detail, at: new Date().toISOString() }),
  }).catch(() => {});
}
