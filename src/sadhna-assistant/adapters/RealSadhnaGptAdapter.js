import { getRequest, postRequest } from "../../services/api";
import { emitSadhnaActivityUpdated } from "../../utils/sadhnaEvents";
import { SadhnaAdapter } from "./SadhnaAdapter";
import { todayISO } from "../utils/dateHelpers";

/**
 * ============================================================================
 * RealSadhnaGptAdapter — the production adapter wiring SadhnaAssistant into
 * SadhanaGPT's real backend (see backend `AssistantController.js` +
 * `routes/Routes.js` for the /assistant/* endpoints this calls).
 * ============================================================================
 *
 * Reuses the app's existing `getRequest`/`postRequest` helpers from
 * services/api.js so auth (the "accesstoken" header + Authorization API key)
 * and the base URL (VITE_API_BASE_URL) work exactly like every other screen
 * in the app — no separate auth plumbing needed here, and no API key of any
 * kind (OpenAI or otherwise) ever touches the browser bundle; that lives
 * only on the backend.
 *
 * Every SadhnaAdapter method below is a thin promise wrapper around one of
 * those calls. The backend does the heavy lifting: resolving `user_id` from
 * the access token, translating this app's `fix_activities`/`daily_report`
 * schema into the ActivityDefinition/ActivityRecord shapes SadhnaAssistant
 * expects, and computing marks with the same engine the rest of the app
 * uses.
 */

function callGet(url, params = {}) {
  return new Promise((resolve, reject) => {
    getRequest(url, params, (response) => {
      const body = response?.data;
      if (body && body.status === 1) {
        resolve(body.data);
      } else {
        reject(new Error(flattenMessage(body?.message) || `Request to ${url} failed`));
      }
    });
  });
}

function callPost(url, payload = {}) {
  return new Promise((resolve, reject) => {
    postRequest(url, payload, (response) => {
      const body = response?.data;
      if (body && body.status === 1) {
        resolve(body);
      } else {
        // For update endpoints we still want the {success:false, error}
        // shape back rather than a thrown error, so the widget can show a
        // graceful "couldn't save that" message instead of crashing.
        resolve(body || { success: false, error: `Request to ${url} failed` });
      }
    });
  });
}

function flattenMessage(message) {
  if (!message) return "";
  if (Array.isArray(message)) return message[0];
  return String(message);
}

export class RealSadhnaGptAdapter extends SadhnaAdapter {
  getActivities() {
    return callGet("/assistant/activities");
  }

  getTodayActivities() {
    return callGet("/assistant/activities/today");
  }

  getYesterdayActivities() {
    return callGet("/assistant/activities/yesterday");
  }

  async updateActivity(payload) {
    const result = await callPost("/assistant/activities/update", payload);
    if (result.success) emitSadhnaActivityUpdated({ ...payload, date: "today" });
    return {
      success: !!result.success,
      record: result.record,
      error: result.error,
    };
  }

  getActivitiesForDate(date) {
    return callGet(`/assistant/activities/by-date/${encodeURIComponent(date)}`);
  }

  async updateActivityForDate(payload) {
    const result = await callPost("/assistant/activities/update-for-date", payload);
    // The dashboard only ever shows "today" — only tell it to refetch when
    // the chatbot actually wrote to today's date (a "kal"/particular-date
    // save elsewhere doesn't change what's currently on screen).
    if (result.success && payload?.date === todayISO()) {
      emitSadhnaActivityUpdated(payload);
    }
    return {
      success: !!result.success,
      record: result.record,
      error: result.error,
    };
  }

  getTodayMarks() {
    return callGet("/assistant/marks/today");
  }

  getLast7DaysMarks() {
    return callGet("/assistant/marks/last7days");
  }

  /**
   * Calls the backend's /assistant/nlp/interpret endpoint, which itself:
   *   1. Tries a fast, free, local regex/keyword parse first.
   *   2. Only if that finds nothing, falls back to GPT-5 nano (the cheapest
   *      OpenAI model) for real natural-language understanding.
   *   3. If neither can relate the message to a sadhana activity, returns
   *      intent "unrecognized" with a clarification asking the user to
   *      mention something relevant to their practice.
   * No AI/API key of any kind lives in this file or anywhere in the browser.
   */
  interpretNaturalLanguage(text, context, { forceAI = false } = {}) {
    return new Promise((resolve) => {
      postRequest("/assistant/nlp/interpret", { text, context, forceAI }, (response) => {
        const body = response?.data;
        if (body && body.status === 1) {
          resolve(body.data);
        } else {
          // Fail soft — the widget treats this as "please rephrase".
          resolve({
            intent: "clarification_required",
            updates: [],
            clarification: "Something went wrong understanding that — could you rephrase?",
          });
        }
      });
    });
  }

  /**
   * Not part of the base SadhnaAdapter interface (that only covers
   * activity/marks CRUD) — an extra method NLInputBar calls directly for
   * its MediaRecorder-based voice fallback (see its own comments for when
   * that path is used instead of the Web Speech API). Sends a short
   * base64-encoded audio clip to the backend and gets back transcribed
   * text; no audio or API key ever goes anywhere but our own backend.
   */
  transcribeVoiceNote(base64Audio, mimeType) {
    return new Promise((resolve, reject) => {
      postRequest("/assistant/nlp/transcribe", { audio: base64Audio, mimeType }, (response) => {
        const body = response?.data;
        if (body && body.status === 1) {
          resolve(body.data?.text || "");
        } else {
          reject(new Error(flattenMessage(body?.message) || "Could not transcribe audio"));
        }
      });
    });
  }
}

export default RealSadhnaGptAdapter;
