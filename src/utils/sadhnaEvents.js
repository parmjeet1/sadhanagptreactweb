/**
 * A tiny window-level event bus so the SadhnaAssistant chat widget (mounted
 * inside BottomNavigation, far from StudentDashboard in the tree) can tell
 * the dashboard "something changed, refetch" without prop-drilling or a
 * shared store. Fired once per successful activity save from the chatbot.
 */
export const SADHNA_ACTIVITY_UPDATED = "sadhna:activity-updated";

export function emitSadhnaActivityUpdated(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SADHNA_ACTIVITY_UPDATED, { detail }));
}
