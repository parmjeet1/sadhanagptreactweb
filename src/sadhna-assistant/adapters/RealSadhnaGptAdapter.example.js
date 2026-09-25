/**
 * ============================================================================
 * RealSadhnaGptAdapter — REFERENCE IMPLEMENTATION, not wired up by default.
 * ============================================================================
 *
 * This shows the shape of a production adapter that talks to a real
 * SadhnaGPT backend, including the natural-language endpoint that itself
 * calls GPT-5 nano. Rename/copy this file (drop the `.example`), fill in
 * your real endpoints, and pass an instance to <SadhnaAssistant adapter={..} />
 * instead of relying on the MockSadhnaAdapter default.
 *
 * IMPORTANT: every method here just calls YOUR OWN backend over HTTPS.
 * No OpenAI/GPT API key ever appears in this file or anywhere else in the
 * browser bundle — see server-example/index.js for where the actual GPT-5
 * nano call happens, server-side.
 */

import { SadhnaAdapter } from "./SadhnaAdapter";

export class RealSadhnaGptAdapter extends SadhnaAdapter {
  constructor({ baseUrl, getAuthHeaders } = {}) {
    super();
    this.baseUrl = baseUrl; // e.g. "https://api.sadhnagpt.com"
    // A function returning e.g. { Authorization: `Bearer ${token}` } so this
    // adapter never needs to know how auth tokens are stored/refreshed.
    this.getAuthHeaders = getAuthHeaders || (() => ({}));
  }

  async _fetchJson(path, options = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`SadhnaGPT API error ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }

  getActivities() {
    return this._fetchJson("/activities");
  }

  getTodayActivities() {
    return this._fetchJson("/activities/today");
  }

  getYesterdayActivities() {
    return this._fetchJson("/activities/yesterday");
  }

  updateActivity(payload) {
    return this._fetchJson("/activities/update", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Used by "Fill Sadhna on a Particular Date" and "Fill Same Sadhna for
  // Certain Days" — kept as separate endpoints/methods from the "today"
  // ones above so nothing about today's behavior changes.
  getActivitiesForDate(date) {
    return this._fetchJson(`/activities/by-date/${encodeURIComponent(date)}`);
  }

  updateActivityForDate(payload) {
    return this._fetchJson("/activities/update-for-date", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  getTodayMarks() {
    return this._fetchJson("/marks/today");
  }

  getLast7DaysMarks() {
    return this._fetchJson("/marks/last7days");
  }

  /**
   * Calls YOUR backend's /nlp/interpret endpoint (see server-example/), which
   * in turn calls GPT-5 nano with the user's text plus the current activity
   * definitions/state, and returns the same structured shape the mock
   * adapter fakes locally: { intent, updates, confidence?, clarification? }.
   */
  interpretNaturalLanguage(text, context) {
    return this._fetchJson("/nlp/interpret", {
      method: "POST",
      body: JSON.stringify({ text, context }),
    });
  }
}

export default RealSadhnaGptAdapter;
