import { SadhnaAdapter } from "./SadhnaAdapter";

/**
 * ============================================================================
 * MockSadhnaAdapter
 * ============================================================================
 * A fully in-memory stand-in for the real SadhnaGPT backend. It lets
 * SadhnaAssistant run and be demoed completely standalone.
 *
 * Every method logs its inputs/outputs to the console so that whoever wires
 * up the real adapter can see exactly what SadhnaAssistant expects to send
 * and receive.
 *
 * IMPORTANT: This mock intentionally "computes" marks and interprets natural
 * language locally, purely so the demo has something to show. In production
 * both of those responsibilities belong to SadhnaGPT's real backend
 * (marks scoring logic + a secure GPT-5 nano endpoint). SadhnaAssistant
 * itself never performs either calculation — it only calls these adapter
 * methods and renders what comes back.
 */

const todayISO = () => new Date().toISOString().slice(0, 10);

const DEFAULT_ACTIVITIES = [
  {
    activity_id: "chanting",
    name: "Chanting",
    type: "number",
    unit: "rounds",
    goal: 16,
    quickOptions: [4, 8, 12, 16],
    category: "chanting",
    icon: "beads",
    active: true,
  },
  {
    activity_id: "chanting_completion_time",
    name: "Chanting Completion Time",
    type: "time",
    category: "chanting_completion_time",
    dependsOn: "chanting",
    icon: "beads",
    active: true,
  },
  {
    activity_id: "wakeup",
    name: "Wakeup Time",
    type: "time",
    category: "wakeup",
    icon: "sunrise",
    active: true,
  },
  {
    activity_id: "mangal_aarti",
    name: "Mangal Aarti",
    type: "enum",
    category: "mangal_aarti",
    icon: "diya",
    options: [
      { value: "attended", label: "Attended" },
      { value: "online_or_home", label: "Attended Online / Home" },
      { value: "not_today", label: "Not Today" },
    ],
    active: true,
  },
  {
    activity_id: "hearing",
    name: "Hearing",
    type: "duration",
    unit: "minutes",
    goal: 30,
    quickOptions: [15, 30, 45, 60],
    category: "hearing",
    icon: "headphones",
    active: true,
  },
  {
    activity_id: "reading",
    name: "Reading",
    type: "duration",
    unit: "minutes",
    goal: 20,
    quickOptions: [10, 20, 30, 45],
    category: "reading",
    icon: "book",
    active: true,
  },
  {
    activity_id: "day_rest",
    name: "Day Rest",
    type: "duration",
    unit: "minutes",
    category: "day_rest",
    icon: "moon",
    active: true,
  },
  {
    activity_id: "sleep_time",
    name: "Sleep Time",
    type: "time",
    category: "sleep",
    icon: "moon",
    active: true,
  },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function log(label, payload) {
  // eslint-disable-next-line no-console
  console.log(`%c[MockSadhnaAdapter] ${label}`, "color:#c4651a;font-weight:600;", payload);
}

export class MockSadhnaAdapter extends SadhnaAdapter {
  constructor(options = {}) {
    super();
    this._activities = options.activities ?? DEFAULT_ACTIVITIES;
    this._today = new Map(); // activity_id -> value
    this._yesterday = new Map([
      ["chanting", 16],
      ["chanting_completion_time", "07:10"],
      ["wakeup", "04:40"],
      ["mangal_aarti", "attended"],
      ["hearing", 30],
      ["reading", 20],
      ["day_rest", 20],
      ["sleep_time", "22:15"],
    ]);
    this._artificialDelay = options.artificialDelay ?? 260;
    this._simulatedHistory = options.history ?? this._buildSimulatedHistory();
    // dateISO -> Map(activity_id -> value). Deliberately separate from
    // _today/_yesterday above — see SadhnaAdapter.js's note on
    // getActivitiesForDate/updateActivityForDate for why.
    this._byDate = new Map();
  }

  _buildSimulatedHistory() {
    const base = [64, 71, 68, 82, 77, 90, 86];
    const out = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      out.push({
        date: d.toISOString().slice(0, 10),
        label: DAY_LABELS[d.getDay()],
        marks: base[6 - i],
      });
    }
    return out;
  }

  async _delay() {
    if (this._artificialDelay > 0) {
      await new Promise((r) => setTimeout(r, this._artificialDelay));
    }
  }

  async getActivities() {
    await this._delay();
    const result = this._activities.filter((a) => a.active);
    log("getActivities()", result);
    return result;
  }

  async getTodayActivities() {
    await this._delay();
    const result = this._activities
      .filter((a) => a.active)
      .map((a) => ({
        activity_id: a.activity_id,
        value: this._today.has(a.activity_id) ? this._today.get(a.activity_id) : null,
        recordedAt: this._today.has(a.activity_id) ? new Date().toISOString() : undefined,
      }));
    log("getTodayActivities()", result);
    return result;
  }

  async getYesterdayActivities() {
    await this._delay();
    const result = this._activities
      .filter((a) => a.active)
      .map((a) => ({
        activity_id: a.activity_id,
        value: this._yesterday.has(a.activity_id) ? this._yesterday.get(a.activity_id) : null,
      }));
    log("getYesterdayActivities()", result);
    return result;
  }

  async updateActivity(payload) {
    log("updateActivity() called with", payload);
    await this._delay();
    if (!payload || !payload.activity_id) {
      const error = { success: false, error: "activity_id is required" };
      log("updateActivity() -> error", error);
      return error;
    }
    this._today.set(payload.activity_id, payload.value);
    const response = {
      success: true,
      record: {
        activity_id: payload.activity_id,
        value: payload.value,
        recordedAt: new Date().toISOString(),
      },
    };
    log("updateActivity() -> response", response);
    return response;
  }

  async getActivitiesForDate(dateISO) {
    await this._delay();
    const dayMap = this._byDate.get(dateISO) || new Map();
    const result = this._activities
      .filter((a) => a.active)
      .map((a) => ({
        activity_id: a.activity_id,
        value: dayMap.has(a.activity_id) ? dayMap.get(a.activity_id) : null,
      }));
    log(`getActivitiesForDate(${dateISO})`, result);
    return result;
  }

  async updateActivityForDate(payload) {
    log("updateActivityForDate() called with", payload);
    await this._delay();
    if (!payload || !payload.activity_id || !payload.date) {
      const error = { success: false, error: "activity_id and date are required" };
      log("updateActivityForDate() -> error", error);
      return error;
    }
    if (!this._byDate.has(payload.date)) this._byDate.set(payload.date, new Map());
    this._byDate.get(payload.date).set(payload.activity_id, payload.value);
    const response = {
      success: true,
      record: {
        activity_id: payload.activity_id,
        value: payload.value,
        recordedAt: new Date().toISOString(),
      },
    };
    log("updateActivityForDate() -> response", response);
    return response;
  }

  async getTodayMarks() {
    await this._delay();
    const activeActivities = this._activities.filter((a) => a.active);
    const completed = activeActivities.filter((a) => {
      const v = this._today.get(a.activity_id);
      return v !== undefined && v !== null && v !== "";
    });

    // NOTE: this scoring logic is a MOCK STAND-IN for SadhnaGPT's real,
    // authoritative marks engine. SadhnaAssistant never performs this
    // calculation itself — it only calls getTodayMarks() and renders
    // whatever the backend returns.
    let marks = 0;
    for (const a of completed) {
      const v = this._today.get(a.activity_id);
      if (a.activity_id === "chanting" && a.goal) {
        marks += Math.min(1, Number(v) / a.goal) * 30;
      } else if (a.activity_id === "hearing" && a.goal) {
        marks += Math.min(1, Number(v) / a.goal) * 15;
      } else if (a.activity_id === "reading" && a.goal) {
        marks += Math.min(1, Number(v) / a.goal) * 10;
      } else if (a.activity_id === "mangal_aarti") {
        marks += v === "attended" ? 15 : v === "online_or_home" ? 10 : 2;
      } else {
        marks += 100 / activeActivities.length / 2;
      }
    }
    marks = Math.round(Math.min(100, marks));

    const yesterdayMarks = this._simulatedHistory[this._simulatedHistory.length - 1]?.marks;

    const response = {
      marks,
      maxMarks: 100,
      yesterdayMarks,
      completedCount: completed.length,
      totalActiveCount: activeActivities.length,
    };
    log("getTodayMarks() -> response", response);
    return response;
  }

  async getLast7DaysMarks() {
    await this._delay();
    log("getLast7DaysMarks() -> response", this._simulatedHistory);
    return this._simulatedHistory;
  }

  /**
   * Mock stand-in for a call to a secure backend endpoint that itself calls
   * GPT-5 nano. This function does simple local pattern matching — it is
   * NOT a language model, and it exists purely so the standalone demo can
   * show the natural-language flow end to end.
   *
   * The real adapter implementation should instead POST `text` + `context`
   * to SadhnaGPT's backend and return whatever structured result comes
   * back. No API key of any kind belongs in this file or anywhere in the
   * browser bundle.
   */
  async interpretNaturalLanguage(text, context) {
    log("interpretNaturalLanguage() called with", { text, context });
    await this._delay();

    const activities = context?.activities ?? this._activities.filter((a) => a.active);
    const updates = [];
    const lower = (text || "").toLowerCase();

    const activityById = new Map(activities.map((a) => [a.activity_id, a]));

    // rounds / chanting
    const roundsMatch = lower.match(/(\d{1,3})\s*(rounds?|round|mala)/);
    if (roundsMatch && activityById.has("chanting")) {
      updates.push({ activity_id: "chanting", value: Number(roundsMatch[1]) });
    }

    // hearing minutes
    const hearingMatch = lower.match(/(\d{1,3})\s*(min(ute)?s?)\s*(of\s*)?hearing|hearing[^.\d]{0,15}(\d{1,3})\s*min/);
    if (hearingMatch && activityById.has("hearing")) {
      const val = Number(hearingMatch[1] || hearingMatch[5]);
      if (val) updates.push({ activity_id: "hearing", value: val });
    }

    // reading minutes
    const readingMatch = lower.match(/(\d{1,3})\s*(min(ute)?s?)\s*(of\s*)?reading|reading[^.\d]{0,15}(\d{1,3})\s*min/);
    if (readingMatch && activityById.has("reading")) {
      const val = Number(readingMatch[1] || readingMatch[5]);
      if (val) updates.push({ activity_id: "reading", value: val });
    }

    // wakeup / woke at HH:MM
    const wakeMatch = lower.match(/(?:woke|wake|utha|uthi)[^\d]{0,10}(\d{1,2})[:.](\d{2})/);
    if (wakeMatch && activityById.has("wakeup")) {
      const h = wakeMatch[1].padStart(2, "0");
      updates.push({ activity_id: "wakeup", value: `${h}:${wakeMatch[2]}` });
    }

    // mangal aarti
    if (/mangal.?a?arti/.test(lower) && activityById.has("mangal_aarti")) {
      if (/(not|missed|couldn'?t|didn'?t)/.test(lower)) {
        updates.push({ activity_id: "mangal_aarti", value: "not_today" });
      } else if (/(online|home)/.test(lower)) {
        updates.push({ activity_id: "mangal_aarti", value: "online_or_home" });
      } else if (/(attend|went|present)/.test(lower)) {
        updates.push({ activity_id: "mangal_aarti", value: "attended" });
      }
    }

    // generic "<number> min <activity name>" fallback for custom activities
    for (const a of activities) {
      if (updates.some((u) => u.activity_id === a.activity_id)) continue;
      const nameLower = a.name.toLowerCase();
      const re = new RegExp(`(\\d{1,3})\\s*(min(ute)?s?)?[^\\n]{0,10}${nameLower}|${nameLower}[^\\n\\d]{0,15}(\\d{1,3})`);
      const m = lower.match(re);
      if (m) {
        const val = Number(m[1] || m[4]);
        if (val) updates.push({ activity_id: a.activity_id, value: val });
      }
    }

    let result;
    if (updates.length > 0) {
      result = {
        intent: "update_activities",
        updates,
        confidence: 0.9,
      };
    } else if (lower.trim().length > 0) {
      result = {
        intent: "clarification_required",
        updates: [],
        clarification:
          "I couldn't quite match that to your activities. Could you rephrase, e.g. '16 rounds, 30 min hearing, woke at 4:25'?",
      };
    } else {
      result = { intent: "unrecognized", updates: [] };
    }

    log("interpretNaturalLanguage() -> response", result);
    return result;
  }
}
