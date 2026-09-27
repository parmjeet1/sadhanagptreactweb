/**
 * ============================================================================
 * SadhnaAdapter — the contract between SadhnaAssistant (this module) and the
 * host application (SadhnaGPT).
 * ============================================================================
 *
 * SadhnaAssistant NEVER talks to a database, NEVER computes marks, and NEVER
 * mutates the host application's state directly. Every side effect flows
 * through an object that implements this interface.
 *
 * The host app is free to swap MockSadhnaAdapter for a real implementation
 * that calls SadhnaGPT's backend. As long as the real adapter implements the
 * same methods with the same shapes, SadhnaAssistant does not need to change
 * at all.
 *
 * ----------------------------------------------------------------------------
 * TYPES (documented via JSDoc — this is a plain .js file, no build step
 * dependency on TypeScript is required to consume it)
 * ----------------------------------------------------------------------------
 *
 * @typedef {Object} ActivityOption
 * @property {string} value
 * @property {string} label
 *
 * @typedef {Object} ActivityDefinition
 * @property {string} activity_id           Stable unique id, e.g. "chanting"
 * @property {string} name                  Display name, e.g. "Chanting"
 * @property {"number"|"duration"|"time"|"boolean"|"enum"|"text"|"custom"} type
 * @property {string} [unit]                e.g. "rounds", "minutes"
 * @property {number} [goal]                Target value, if applicable
 * @property {number[]} [quickOptions]      Suggested quick-pick values
 * @property {ActivityOption[]} [options]   Required when type === "enum"
 * @property {string} category              Semantic category used for
 *                                           message-engine lookups, e.g.
 *                                           "chanting", "wakeup", "custom"
 * @property {string} [icon]                Hint for which sticker/icon to use
 * @property {string} [dependsOn]           activity_id this activity should
 *                                           only be asked about after
 * @property {boolean} active               Whether this activity is currently
 *                                           in use. Inactive activities must
 *                                           never appear in the flow.
 *
 * @typedef {Object} ActivityRecord
 * @property {string} activity_id
 * @property {string|number|boolean|null} value  null/undefined = not filled
 * @property {string} [recordedAt]          ISO timestamp, optional
 *
 * @typedef {Object} UpdateActivityPayload
 * @property {string} activity_id
 * @property {string|number|boolean} value
 *
 * @typedef {Object} UpdateActivityForDatePayload
 * @property {string} activity_id
 * @property {string|number|boolean} value
 * @property {string} date                  ISO date, e.g. "2026-09-16" —
 *                                           never "today"/"yesterday", an
 *                                           actual calendar date, and never
 *                                           in the future.
 *
 * @typedef {Object} UpdateActivityResponse
 * @property {boolean} success
 * @property {ActivityRecord} [record]
 * @property {string} [error]
 *
 * @typedef {Object} MarksResponse
 * @property {number} marks                 The authoritative score, as
 *                                           returned by SadhnaGPT. This
 *                                           module never invents this value.
 * @property {number} [maxMarks]             Optional — only shown if provided
 * @property {number} [yesterdayMarks]
 * @property {number} completedCount
 * @property {number} totalActiveCount
 *
 * @typedef {Object} DailyMarks
 * @property {string} date                  ISO date, e.g. "2026-09-16"
 * @property {string} label                 Short display label, e.g. "Mon"
 * @property {number} marks
 *
 * @typedef {Object} InterpretationUpdate
 * @property {string} activity_id
 * @property {string|number|boolean} value
 *
 * @typedef {Object} InterpretationResult
 * @property {"update_activities"|"clarification_required"|"unrecognized"} intent
 * @property {InterpretationUpdate[]} updates
 * @property {number} [confidence]
 * @property {string} [clarification]
 *
 * ----------------------------------------------------------------------------
 * INTERFACE (documented for reference; MockSadhnaAdapter implements it below)
 * ----------------------------------------------------------------------------
 *
 * class SadhnaAdapter {
 *   getActivities(): Promise<ActivityDefinition[]>
 *   getTodayActivities(): Promise<ActivityRecord[]>
 *   getYesterdayActivities(): Promise<ActivityRecord[]>
 *   updateActivity(payload: UpdateActivityPayload): Promise<UpdateActivityResponse>
 *   getActivitiesForDate(date: string): Promise<ActivityRecord[]>
 *   updateActivityForDate(payload: UpdateActivityForDatePayload): Promise<UpdateActivityResponse>
 *   getTodayMarks(): Promise<MarksResponse>
 *   getLast7DaysMarks(): Promise<DailyMarks[]>
 *   interpretNaturalLanguage(text: string, context: object): Promise<InterpretationResult>
 * }
 *
 * A host adapter must implement every method above. SadhnaAssistant treats
 * every method as async and will `await` it regardless of whether the real
 * implementation is synchronous under the hood.
 *
 * ----------------------------------------------------------------------------
 * getActivitiesForDate / updateActivityForDate — added for "Fill Sadhna on a
 * Particular Date" and "Fill Same Sadhna for Certain Days". These are
 * DELIBERATELY separate from getTodayActivities/getYesterdayActivities/
 * updateActivity rather than folding a `date` parameter into those, so
 * existing "today" behavior and existing real adapters are entirely
 * unaffected — you only need to implement these two additional methods to
 * support the new flows; nothing about "today" changes.
 * ----------------------------------------------------------------------------
 */

export const ACTIVITY_TYPES = /** @type {const} */ ([
  "number",
  "duration",
  "time",
  "boolean",
  "enum",
  "text",
  "custom",
]);

/**
 * Base class purely for documentation / optional `instanceof` checks.
 * Not required — any object satisfying the shape above works fine.
 */
export class SadhnaAdapter {
  async getActivities() {
    throw new Error("SadhnaAdapter.getActivities() not implemented");
  }
  async getTodayActivities() {
    throw new Error("SadhnaAdapter.getTodayActivities() not implemented");
  }
  async getYesterdayActivities() {
    throw new Error("SadhnaAdapter.getYesterdayActivities() not implemented");
  }
  async updateActivity(_payload) {
    throw new Error("SadhnaAdapter.updateActivity() not implemented");
  }
  async getActivitiesForDate(_date) {
    throw new Error("SadhnaAdapter.getActivitiesForDate() not implemented");
  }
  async updateActivityForDate(_payload) {
    throw new Error("SadhnaAdapter.updateActivityForDate() not implemented");
  }
  async getTodayMarks() {
    throw new Error("SadhnaAdapter.getTodayMarks() not implemented");
  }
  async getLast7DaysMarks() {
    throw new Error("SadhnaAdapter.getLast7DaysMarks() not implemented");
  }
  async interpretNaturalLanguage(_text, _context) {
    throw new Error(
      "SadhnaAdapter.interpretNaturalLanguage() not implemented"
    );
  }
}
