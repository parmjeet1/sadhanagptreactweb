import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Heart } from "lucide-react";
import ChatBubble from "./components/ChatBubble";
import MenuOptions from "./components/MenuOptions";
import MarksCard from "./components/MarksCard";
import QuickFillAllCard from "./components/QuickFillAllCard";
import ProgressChart from "./components/ProgressChart";
import ActivityQuestion from "./components/inputs/ActivityQuestion";
import NLInputBar from "./components/NLInputBar";
import NLConfirmCard from "./components/NLConfirmCard";
import DatePickerCard from "./components/DatePickerCard";
import DateRangePickerCard from "./components/DateRangePickerCard";
import Sticker from "./components/visuals/Sticker";
import { PrimaryButton, SecondaryButton } from "./components/ChatButton";
import { getMessage } from "./data/sadhnaMessages";
import { resolveMessageContext } from "./utils/messageContext";
import {
  indexById,
  orderWithDependents,
  isEligible,
  isFilled,
  getPendingActivities,
  getCompletionStatus,
  formatValueForEcho,
} from "./utils/activityHelpers";
import { isoDaysAgo, formatDateLabel, enumerateDates, todayISO } from "./utils/dateHelpers";

/**
 * SadhnaChat — the conversational engine. Everything the user sees is one
 * ordered list of "blocks" (bot/user bubbles, cards, menus, inline activity
 * questions). Only the most recently appended interactive block is ever
 * live; once acted on, its handler appends whatever comes next.
 *
 * All persistence and scoring flows through the `adapter` prop
 * (SadhnaAdapter interface) — this component never talks to a database and
 * never invents marks itself.
 */
export function SadhnaChat({ adapter }) {
  const [blocks, setBlocks] = useState([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  // Which day free-text ("kal ki chanting 26 mala") currently applies to.
  // Starts at today every time the chat is freshly mounted (i.e. every time
  // the assistant panel is opened) and only changes when the user's own
  // message names a day ("kal"/yesterday, a date, "aaj"/today, ...) — see
  // handleNaturalLanguage. It stays "sticky" across messages after that
  // until the user mentions a different day again, so a whole back-and-forth
  // about yesterday's sadhna doesn't require repeating "kal" every time.
  const [nlActiveDate, setNlActiveDate] = useState(() => todayISO());

  const idRef = useRef(0);
  const scrollRef = useRef(null);

  const activitiesRef = useRef([]);
  const activitiesByIdRef = useRef({});
  const todayMapRef = useRef(new Map());
  const yesterdayMapRef = useRef(new Map());
  const flowRef = useRef(null); // 'guide' | 'pending' | 'yesterday' | 'quickFill' | null
  const queueRef = useRef([]);

  // State for the "Fill Sadhna on a Particular Date" / "Fill Same Sadhna for
  // Certain Days" flows — deliberately kept separate from flowRef/queueRef/
  // todayMapRef above so the existing "today" flow is completely untouched.
  // Shape: { mode: 'particularDate' | 'certainDays', date, rangeStart, rangeEnd,
  //          dateLabel, queue: string[], map: Map(activity_id -> value) }
  const dateFlowRef = useRef(null);

  const nextId = () => `b${idRef.current++}`;

  const pushBlock = useCallback((block) => {
    setBlocks((prev) => [...prev, { id: nextId(), ...block }]);
  }, []);

  const updateBlock = useCallback((id, patch) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const pushBot = useCallback(
    (text, visual, animation = "none") => pushBlock({ kind: "bot-text", text, visual, animation }),
    [pushBlock]
  );

  const pushUser = useCallback((text) => pushBlock({ kind: "user-text", text }), [pushBlock]);

  const pushBotMessage = useCallback(
    (context, subcontext, vars) => {
      const { message, visual, animation } = getMessage(context, subcontext, vars);
      pushBot(message, visual, animation);
    },
    [pushBot]
  );

  // ---------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [defs, todayRecords] = await Promise.all([
        adapter.getActivities(),
        adapter.getTodayActivities(),
      ]);
      if (cancelled) return;

      const activeDefs = defs.filter((a) => a.active);
      activitiesRef.current = activeDefs;
      activitiesByIdRef.current = indexById(activeDefs);

      const map = new Map();
      for (const rec of todayRecords) {
        if (isFilled(rec.value)) map.set(rec.activity_id, rec.value);
      }
      todayMapRef.current = map;

      pushBlock({
        kind: "bot-text",
        text: "🙏\n\nHare Krishna!\nHow would you like to continue today?",
        visual: "welcome",
        animation: "none",
      });
      await showEncouragingMarksIfAny();
      pushMainMenu();
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapter]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [blocks]);

  // ---------------------------------------------------------------------
  // Menu builders
  // ---------------------------------------------------------------------
  const pushMainMenu = () => {
    pushBlock({
      kind: "menu",
      options: [
        { label: "✨ Fill Today's Sadhna", value: "fillToday" },
        { label: "📆 Fill Sadhna on a Particular Date", value: "fillParticularDate" },
        { label: "🗓️ Fill Same Sadhna for Certain Days", value: "fillCertainDays" },
        { label: "📈 My 7-Day Progress", value: "sevenDayProgress" },
        { label: "📋 What's Pending?", value: "whatsPending" },
        { label: "📅 Yesterday's Sadhna", value: "yesterdaySadhna" },
      ],
    });
  };

  const pushDateSubmenu = () => {
    pushBlock({
      kind: "dateSubmenu",
      options: [
        { label: "📅 Yesterday", value: "yesterday" },
        { label: "📅 Day Before Yesterday", value: "dayBefore" },
        { label: "🗓️ Select a Date", value: "selectDate" },
      ],
    });
  };

  const pushFillMenu = () => {
    pushBlock({
      kind: "menu",
      options: [
        { label: "⚡ Quick Fill All", value: "quickFillAll" },
        { label: "🪷 Guide Me Step by Step", value: "guideMe" },
        { label: "📋 Complete Only Pending", value: "pendingOnly" },
        { label: "📅 Use Yesterday as Starting Point", value: "useYesterday" },
      ],
    });
  };

  const pushActionButtons = (options) => pushBlock({ kind: "actions", options });

  // ---------------------------------------------------------------------
  // Core: submitting one activity's value
  // ---------------------------------------------------------------------
  const activeActivities = () => activitiesRef.current;

  /** Persists a value via the adapter, echoes it, and shows a contextual
   * response. Returns { allComplete } — the only thing that stops a
   * sequential queue mid-flight is every active activity now being filled;
   * otherwise the user is taken all the way through to the end before
   * marks are shown (see evaluateProgressAndShow). */
  const submitActivity = async (activity, value, { silent = false } = {}) => {
    await adapter.updateActivity({ activity_id: activity.activity_id, value });

    const newMap = new Map(todayMapRef.current);
    newMap.set(activity.activity_id, value);
    todayMapRef.current = newMap;

    if (!silent) {
      pushUser(formatValueForEcho(activity, value));
      const { context, subcontext, vars } = resolveMessageContext(activity, value);
      pushBotMessage(context, subcontext, vars);
    }

    const status = getCompletionStatus(activeActivities(), todayMapRef.current);
    if (status.allComplete) {
      await handleAllComplete();
      return { allComplete: true };
    }
    return { allComplete: false };
  };

  // ---------------------------------------------------------------------
  // Sequential queue flows (Guide Me / Complete Only Pending / Use Yesterday)
  // ---------------------------------------------------------------------
  const askNextInQueue = async () => {
    while (queueRef.current.length > 0) {
      const id = queueRef.current.shift();
      const activity = activitiesByIdRef.current[id];
      if (!activity) continue;
      if (isFilled(todayMapRef.current.get(id))) continue;
      if (!isEligible(activity, todayMapRef.current, activitiesByIdRef.current)) continue;

      const suggestion =
        flowRef.current === "yesterday" ? yesterdayMapRef.current.get(id) : undefined;

      pushBlock({ kind: "activity", activity, suggestion });
      return;
    }
    // queue exhausted — reached the end without stopping early
    flowRef.current = null;
    await evaluateProgressAndShow();
  };

  const handleActivityBlockSubmit = async (blockId, activity, value) => {
    updateBlock(blockId, { resolved: true, chosenValue: value });
    const result = await submitActivity(activity, value, { silent: false });
    if (!result.allComplete) {
      await askNextInQueue();
    }
  };

  // ---------------------------------------------------------------------
  // Marks snapshots — shown whenever the user pauses or returns, never
  // mid-way through a flow they're actively working through.
  // ---------------------------------------------------------------------
  const showMarksCardWithActions = async (status, messageContext, messageSubcontext) => {
    setBusy(true);
    const marksResponse = await adapter.getTodayMarks();
    setBusy(false);
    if (messageContext) pushBotMessage(messageContext, messageSubcontext);
    pushBlock({ kind: "marksCard", marksResponse, celebrate: false });
    const remaining = status.total - status.completed;
    pushBot(
      remaining === 1 ? "One activity is still waiting." : `${remaining} activities are still waiting.`
    );
    pushActionButtons([
      { label: "Complete Remaining", value: "completeRemaining" },
      { label: "See 7-Day Progress", value: "seeProgress" },
      { label: "Finish for Now", value: "finish" },
    ]);
  };

  /** Called whenever a flow naturally pauses (queue exhausted, Quick Fill's
   * Continue clicked, or after an NL update) — never mid-flow. Shows marks
   * if anything is recorded; otherwise a gentle nudge back to the menu. */
  const evaluateProgressAndShow = async () => {
    const status = getCompletionStatus(activeActivities(), todayMapRef.current);

    if (status.allComplete) {
      await handleAllComplete();
      return;
    }

    if (status.completed > 0) {
      await showMarksCardWithActions(status, "progress", "thresholdReached");
    } else {
      pushBot("🌱 Nothing recorded yet — whenever you're ready, I'm here.", "sprout");
      pushActionButtons([{ label: "Back to Menu", value: "backToMenu" }]);
    }
  };

  /** Called on app load and whenever the user re-enters "Fill Today's
   * Sadhna" — if they already have partial or full progress recorded, show
   * it first as encouragement before anything else. */
  const showEncouragingMarksIfAny = async () => {
    const status = getCompletionStatus(activeActivities(), todayMapRef.current);
    if (status.completed === 0) return;

    setBusy(true);
    const marksResponse = await adapter.getTodayMarks();
    setBusy(false);
    pushBotMessage(status.allComplete ? "completion" : "returning", status.allComplete ? "allComplete" : undefined);
    pushBlock({ kind: "marksCard", marksResponse, celebrate: false });
  };

  const handleAllComplete = async () => {
    flowRef.current = null;
    queueRef.current = [];
    setBusy(true);
    const marksResponse = await adapter.getTodayMarks();
    setBusy(false);
    const status = getCompletionStatus(activeActivities(), todayMapRef.current);
    pushBotMessage("completion", "allComplete");
    pushBot(
      `${status.total} / ${status.total} activities recorded ✓`,
      undefined,
      "none"
    );
    pushBlock({
      kind: "marksCard",
      marksResponse,
      celebrate: true,
      title: "🏆 TODAY'S SADHNA",
    });
    pushActionButtons([
      { label: "📈 Compare My Progress", value: "seeProgress" },
      { label: "✓ Done", value: "finish" },
    ]);
  };

  // ---------------------------------------------------------------------
  // Menu / action selection
  // ---------------------------------------------------------------------
  const startQueueFlow = (kind, ids) => {
    flowRef.current = kind;
    queueRef.current = [...ids];
    askNextInQueue();
  };

  const handleMainMenuSelect = async (blockId, value) => {
    updateBlock(blockId, { resolved: true });
    const labelMap = {
      fillToday: "✨ Fill Today's Sadhna",
      fillParticularDate: "📆 Fill Sadhna on a Particular Date",
      fillCertainDays: "🗓️ Fill Same Sadhna for Certain Days",
      sevenDayProgress: "📈 My 7-Day Progress",
      whatsPending: "📋 What's Pending?",
      yesterdaySadhna: "📅 Yesterday's Sadhna",
    };
    pushUser(labelMap[value] || value);

    if (value === "fillToday") {
      await showEncouragingMarksIfAny();
      pushBot("How would you like to fill today?");
      pushFillMenu();
      return;
    }

    if (value === "fillParticularDate") {
      pushBot("Which date would you like to fill?");
      pushDateSubmenu();
      return;
    }

    if (value === "fillCertainDays") {
      pushBot("Pick the date range — the same Sadhna you fill in next will be recorded for every day in it.");
      pushBlock({ kind: "dateRangePicker" });
      return;
    }

    if (value === "sevenDayProgress") {
      await showSevenDayProgress();
      return;
    }

    if (value === "whatsPending") {
      const pending = getPendingActivities(activeActivities(), todayMapRef.current);
      if (pending.length === 0) {
        pushBot("🌼 Nothing pending — today's Sadhna is fully recorded!", "flower_check");
        pushActionButtons([{ label: "Back to Menu", value: "backToMenu" }]);
      } else {
        pushBlock({ kind: "pendingList", activities: pending });
        pushActionButtons([
          { label: "🪷 Guide Me Through Pending", value: "completeRemaining" },
          { label: "Back to Menu", value: "backToMenu" },
        ]);
      }
      return;
    }

    if (value === "yesterdaySadhna") {
      setBusy(true);
      const records = await adapter.getYesterdayActivities();
      setBusy(false);
      pushBlock({ kind: "yesterdaySnapshot", records });
      pushActionButtons([{ label: "Back to Menu", value: "backToMenu" }]);
      return;
    }
  };

  const handleFillMenuSelect = async (blockId, value) => {
    updateBlock(blockId, { resolved: true });
    const labelMap = {
      quickFillAll: "⚡ Quick Fill All",
      guideMe: "🪷 Guide Me Step by Step",
      pendingOnly: "📋 Complete Only Pending",
      useYesterday: "📅 Use Yesterday as Starting Point",
    };
    pushUser(labelMap[value] || value);

    const allOrdered = orderWithDependents(activeActivities());
    const pending = allOrdered.filter((a) => !isFilled(todayMapRef.current.get(a.activity_id)));

    // Today's Sadhna is already fully recorded — these three methods exist
    // to fill in what's missing, so with nothing missing just show marks +
    // congratulations rather than an empty fill flow.
    const alreadyComplete = allOrdered.length > 0 && pending.length === 0;
    if (alreadyComplete && ["quickFillAll", "guideMe", "pendingOnly"].includes(value)) {
      await handleAllComplete();
      return;
    }

    if (value === "quickFillAll") {
      flowRef.current = "quickFill";
      pushBlock({ kind: "quickFillAll", activities: pending });
      return;
    }

    if (value === "guideMe") {
      pushBot("🪷 Let's go through today's Sadhna together.");
      startQueueFlow(
        "guide",
        allOrdered.map((a) => a.activity_id)
      );
      return;
    }

    if (value === "pendingOnly") {
      startQueueFlow(
        "pending",
        pending.map((a) => a.activity_id)
      );
      return;
    }

    if (value === "useYesterday") {
      setBusy(true);
      const records = await adapter.getYesterdayActivities();
      setBusy(false);
      const yMap = new Map();
      for (const r of records) if (isFilled(r.value)) yMap.set(r.activity_id, r.value);
      yesterdayMapRef.current = yMap;
      pushBot("Here's yesterday's Sadhna as a starting point — confirm or change each one.");
      startQueueFlow(
        "yesterday",
        pending.map((a) => a.activity_id)
      );
      return;
    }
  };

  // ---------------------------------------------------------------------
  // "Fill Sadhna on a Particular Date" / "Fill Same Sadhna for Certain Days"
  //
  // Kept fully separate from the "today" flow above (own ref, own queue
  // engine, own submit path) so nothing about filling today is touched.
  // ---------------------------------------------------------------------
  const handleDateSubmenuSelect = async (blockId, value) => {
    updateBlock(blockId, { resolved: true });

    if (value === "yesterday") {
      pushUser("📅 Yesterday");
      await beginParticularDateFlow(isoDaysAgo(1));
      return;
    }
    if (value === "dayBefore") {
      pushUser("📅 Day Before Yesterday");
      await beginParticularDateFlow(isoDaysAgo(2));
      return;
    }
    if (value === "selectDate") {
      pushUser("🗓️ Select a Date");
      pushBlock({ kind: "datePicker" });
    }
  };

  const handleDatePickerConfirm = async (blockId, dateISO) => {
    updateBlock(blockId, { resolved: true });
    pushUser(formatDateLabel(dateISO));
    await beginParticularDateFlow(dateISO);
  };

  const handleDateRangeConfirm = async (blockId, startISO, endISO) => {
    updateBlock(blockId, { resolved: true });
    pushUser(`${formatDateLabel(startISO)} → ${formatDateLabel(endISO)}`);
    await beginCertainDaysFlow(startISO, endISO);
  };

  /** Fetches whatever is already recorded for `dateISO` (if anything) as a
   * starting point, then walks through every active activity for that date
   * — same step-by-step shape as "Guide Me", but reading/writing that date
   * instead of today. */
  const beginParticularDateFlow = async (dateISO) => {
    setBusy(true);
    const records = await adapter.getActivitiesForDate(dateISO);
    setBusy(false);

    const seedMap = new Map();
    for (const r of records) if (isFilled(r.value)) seedMap.set(r.activity_id, r.value);

    const ordered = orderWithDependents(activeActivities());
    dateFlowRef.current = {
      mode: "particularDate",
      date: dateISO,
      dateLabel: formatDateLabel(dateISO),
      queue: ordered.map((a) => a.activity_id),
      map: seedMap,
    };
    pushBot(`🪷 Let's fill Sadhna for ${formatDateLabel(dateISO)}.`);
    askNextInDateQueue();
  };

  /** Walks through every active activity ONCE (no per-date data — nothing
   * is written yet), then applies the same collected values to every date
   * in [startISO, endISO] in finishDateFlow(). */
  const beginCertainDaysFlow = async (startISO, endISO) => {
    const ordered = orderWithDependents(activeActivities());
    dateFlowRef.current = {
      mode: "certainDays",
      rangeStart: startISO,
      rangeEnd: endISO,
      dateLabel: `${formatDateLabel(startISO)} → ${formatDateLabel(endISO)}`,
      queue: ordered.map((a) => a.activity_id),
      map: new Map(),
    };
    pushBot("🪷 Let's fill the Sadhna that should apply to every day in that range.");
    askNextInDateQueue();
  };

  const askNextInDateQueue = () => {
    const flow = dateFlowRef.current;
    if (!flow) return;

    while (flow.queue.length > 0) {
      const id = flow.queue.shift();
      const activity = activitiesByIdRef.current[id];
      if (!activity) continue;
      if (isFilled(flow.map.get(id))) continue;
      if (!isEligible(activity, flow.map, activitiesByIdRef.current)) continue;

      pushBlock({
        kind: "activity",
        activity,
        suggestion: flow.mode === "particularDate" ? flow.map.get(id) : undefined,
        suggestionLabel: "Already recorded",
        target: { mode: flow.mode, dateLabel: flow.dateLabel },
      });
      return;
    }
    // queue exhausted
    finishDateFlow();
  };

  const handleDateActivitySubmit = async (blockId, activity, value, target) => {
    updateBlock(blockId, { resolved: true, chosenValue: value });
    pushUser(formatValueForEcho(activity, value));

    const flow = dateFlowRef.current;
    if (!flow) return;

    if (target.mode === "particularDate") {
      setBusy(true);
      await adapter.updateActivityForDate({ activity_id: activity.activity_id, value, date: flow.date });
      setBusy(false);
    }

    flow.map.set(activity.activity_id, value);
    const { context, subcontext, vars } = resolveMessageContext(activity, value);
    pushBotMessage(context, subcontext, vars);
    askNextInDateQueue();
  };

  const finishDateFlow = async () => {
    const flow = dateFlowRef.current;
    dateFlowRef.current = null;
    if (!flow) return;

    if (flow.mode === "particularDate") {
      pushBot(`✅ Sadhna for ${flow.dateLabel} has been recorded.`, "flower_check");
      pushActionButtons([{ label: "Back to Menu", value: "backToMenu" }]);
      return;
    }

    // certainDays: apply the collected values to every date in the range.
    const dates = enumerateDates(flow.rangeStart, flow.rangeEnd);
    if (flow.map.size === 0 || dates.length === 0) {
      pushBot("Nothing was recorded, so there's nothing to apply to those days.");
      pushActionButtons([{ label: "Back to Menu", value: "backToMenu" }]);
      return;
    }

    setBusy(true);
    for (const dateISO of dates) {
      for (const [activity_id, value] of flow.map.entries()) {
        // eslint-disable-next-line no-await-in-loop
        await adapter.updateActivityForDate({ activity_id, value, date: dateISO });
      }
    }
    setBusy(false);

    pushBot(
      `✅ The same Sadhna has been recorded for ${dates.length} day${dates.length === 1 ? "" : "s"} (${flow.dateLabel}).`,
      "flower_check"
    );
    pushActionButtons([{ label: "Back to Menu", value: "backToMenu" }]);
  };

  const showSevenDayProgress = async () => {
    setBusy(true);
    const data = await adapter.getLast7DaysMarks();
    setBusy(false);
    pushBlock({ kind: "progressChart", data });
    pushActionButtons([{ label: "Back to Menu", value: "backToMenu" }]);
  };

  const handleActionSelect = async (blockId, value, label) => {
    updateBlock(blockId, { resolved: true });
    pushUser(label || value);

    if (value === "completeRemaining" || value === "continueFilling") {
      const pending = getPendingActivities(activeActivities(), todayMapRef.current);
      const ordered = orderWithDependents(pending);
      if (ordered.length === 0) {
        await evaluateProgressAndShow();
        return;
      }
      startQueueFlow(
        "pending",
        ordered.map((a) => a.activity_id)
      );
      return;
    }

    if (value === "seeProgress") {
      await showSevenDayProgress();
      return;
    }

    if (value === "finish" || value === "backToMenu") {
      pushBotMessage("returning");
      pushMainMenu();
      return;
    }
  };

  // ---------------------------------------------------------------------
  // Natural language flow
  // ---------------------------------------------------------------------
  /** Runs interpretation (regex-first, then AI fallback unless `forceAI`)
   * and pushes whatever block should follow. Shared by the normal send path
   * and the confirm card's "Ask AI to re-check" button — the only
   * difference is whether the user's message is echoed again. */
  const runInterpretation = async (text, { forceAI = false } = {}) => {
    setBusy(true);
    const context = {
      activities: activeActivities(),
      today: activeActivities().map((a) => ({
        activity_id: a.activity_id,
        value: todayMapRef.current.get(a.activity_id) ?? null,
      })),
    };
    const result = await adapter.interpretNaturalLanguage(text, context, { forceAI });
    setBusy(false);

    // A date mentioned in THIS message becomes the active date for every
    // NL update from here on, until the user names a different day (or the
    // chat is reopened fresh). No date mentioned -> keep whatever is
    // already active, so a follow-up like "aur 30 min hearing" right after
    // "kal ki chanting 26 mala" still applies to yesterday.
    const effectiveDate = result.target_date || nlActiveDate;
    if (result.target_date && result.target_date !== nlActiveDate) {
      setNlActiveDate(result.target_date);
    }

    if (result.intent === "update_activities") {
      const validUpdates = result.updates.filter((u) => activitiesByIdRef.current[u.activity_id]);
      if (validUpdates.length > 0) {
        pushBlock({ kind: "nlConfirm", updates: validUpdates, date: effectiveDate, sourceText: text });
        return;
      }
    }

    if (result.intent === "clarification_required" && result.clarification) {
      pushBot(`🙏 ${result.clarification}`, "welcome");
      return;
    }

    pushBot("🙏 I couldn't quite understand that — you can also use the menu below.", "welcome");
  };

  const handleNaturalLanguage = async (text) => {
    pushUser(text);
    await runInterpretation(text);
  };

  /** Applies confirmed NL updates for TODAY — the existing "today" flow
   * (marks, completion tracking, etc.), completely unchanged. */
  const applyNlUpdatesForToday = async (updates) => {
    let completedNow = false;
    for (const u of updates) {
      const activity = activitiesByIdRef.current[u.activity_id];
      if (!activity) continue;
      // eslint-disable-next-line no-await-in-loop
      const result = await submitActivity(activity, u.value, { silent: false });
      if (result.allComplete) {
        completedNow = true;
        break;
      }
    }
    if (!completedNow) {
      await evaluateProgressAndShow();
    }
  };

  /** Applies confirmed NL updates for a DIFFERENT date (e.g. "kal") — same
   * write path as "Fill Sadhna on a Particular Date", just triggered from
   * free text instead of the date-picker menu. Deliberately doesn't touch
   * todayMapRef/marks, same as that flow. */
  const applyNlUpdatesForDate = async (updates, dateISO) => {
    setBusy(true);
    for (const u of updates) {
      const activity = activitiesByIdRef.current[u.activity_id];
      if (!activity) continue;
      // eslint-disable-next-line no-await-in-loop
      await adapter.updateActivityForDate({ activity_id: u.activity_id, value: u.value, date: dateISO });
      // eslint-disable-next-line no-await-in-loop
      const { context, subcontext, vars } = resolveMessageContext(activity, u.value);
      pushBotMessage(context, subcontext, vars);
    }
    setBusy(false);
    pushBot(`✅ Sadhna for ${formatDateLabel(dateISO)} has been recorded.`, "flower_check");
    pushActionButtons([{ label: "Back to Menu", value: "backToMenu" }]);
  };

  const handleNlConfirm = async (blockId, updates, dateISO) => {
    updateBlock(blockId, { resolved: true });
    if (!dateISO || dateISO === todayISO()) {
      await applyNlUpdatesForToday(updates);
    } else {
      await applyNlUpdatesForDate(updates, dateISO);
    }
  };

  const handleNlCorrect = (blockId) => {
    updateBlock(blockId, { resolved: true });
    pushBot("No problem — go ahead and tell me again, or use the menu below.");
  };

  /** "Ask AI to re-check" — re-runs interpretation on the SAME original
   * text, but forcing the GPT-5 nano path so a wrong fast local guess
   * (e.g. mixing up day-rest and sleep-time) gets a real natural-language
   * re-read instead of just being discarded. Doesn't re-echo the user's
   * message since it's the same text already shown once. */
  const handleNlAskAI = async (blockId, text) => {
    updateBlock(blockId, { resolved: true });
    pushBot("🤖 Let me take a closer look with AI...");
    await runInterpretation(text, { forceAI: true });
  };

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full bg-cream-50">
      <header className="flex items-center gap-2.5 px-4 py-3 border-b border-saffron-100 bg-white/80 backdrop-blur">
        <Sticker name="lotus_sparkles" size={30} />
        <div>
          <h1 className="text-sm font-semibold text-saffron-900 leading-none">Sadhna Assistant</h1>
          <p className="text-[11px] text-saffron-500 mt-0.5">Your daily devotional companion</p>
        </div>
      </header>

      {nlActiveDate !== todayISO() && (
        <div className="flex items-center justify-between gap-2 px-4 py-1.5 bg-saffron-100 border-b border-saffron-200 text-[11px] font-semibold text-saffron-700">
          <span>📅 Free-text is currently filling: {formatDateLabel(nlActiveDate)}</span>
          <button
            type="button"
            onClick={() => setNlActiveDate(todayISO())}
            className="underline underline-offset-2 shrink-0"
          >
            Switch to Today
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto sadhna-scroll px-3.5 py-4 space-y-3">
        {blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            onMainMenuSelect={(v) => handleMainMenuSelect(block.id, v)}
            onFillMenuSelect={(v) => handleFillMenuSelect(block.id, v)}
            onActionSelect={(v, l) => handleActionSelect(block.id, v, l)}
            onActivitySubmit={(v) =>
              block.target
                ? handleDateActivitySubmit(block.id, block.activity, v, block.target)
                : handleActivityBlockSubmit(block.id, block.activity, v)
            }
            onQuickFillActivitySubmit={submitActivity}
            onQuickFillContinue={() => {
              updateBlock(block.id, { resolved: true });
              evaluateProgressAndShow();
            }}
            onQuickFillAllDone={() => updateBlock(block.id, { resolved: true })}
            onSparkleDone={() => updateBlock(block.id, { celebrate: false })}
            onNlConfirm={() => handleNlConfirm(block.id, block.updates, block.date)}
            onNlCorrect={() => handleNlCorrect(block.id)}
            onNlAskAI={() => handleNlAskAI(block.id, block.sourceText)}
            onDateSubmenuSelect={(v) => handleDateSubmenuSelect(block.id, v)}
            onDatePickerConfirm={(dateISO) => handleDatePickerConfirm(block.id, dateISO)}
            onDateRangeConfirm={(startISO, endISO) => handleDateRangeConfirm(block.id, startISO, endISO)}
            todayMap={todayMapRef.current}
            activitiesById={activitiesByIdRef.current}
          />
        ))}
        {!ready && (
          <div className="flex items-center gap-2 text-saffron-400 text-sm px-2">
            <Heart size={14} className="animate-pulse" /> Loading your Sadhna...
          </div>
        )}
      </div>

      <NLInputBar
        onSend={handleNaturalLanguage}
        disabled={busy}
        activityNames={activitiesRef.current.map((a) => a.name)}
        adapter={adapter}
      />
    </div>
  );
}

// ===========================================================================
// Block renderer
// ===========================================================================
function BlockRenderer({
  block,
  onMainMenuSelect,
  onFillMenuSelect,
  onActionSelect,
  onActivitySubmit,
  onQuickFillActivitySubmit,
  onQuickFillContinue,
  onQuickFillAllDone,
  onSparkleDone,
  onNlConfirm,
  onNlCorrect,
  onNlAskAI,
  onDateSubmenuSelect,
  onDatePickerConfirm,
  onDateRangeConfirm,
  todayMap,
  activitiesById,
}) {
  switch (block.kind) {
    case "bot-text":
      return <ChatBubble role="bot" text={block.text} visual={block.visual} animation={block.animation} />;

    case "user-text":
      return <ChatBubble role="user" text={block.text} />;

    case "menu": {
      // Distinguish main-menu vs fill-menu by option values (avoids extra block metadata).
      const isFillMenu = block.options.some((o) => o.value === "quickFillAll");
      const handler = isFillMenu ? onFillMenuSelect : onMainMenuSelect;
      if (block.resolved) return null;
      return <MenuOptions options={block.options} onSelect={handler} />;
    }

    case "dateSubmenu": {
      if (block.resolved) return null;
      return <MenuOptions options={block.options} onSelect={onDateSubmenuSelect} />;
    }

    case "datePicker": {
      if (block.resolved) return null;
      return <DatePickerCard onConfirm={onDatePickerConfirm} />;
    }

    case "dateRangePicker": {
      if (block.resolved) return null;
      return <DateRangePickerCard onConfirm={onDateRangeConfirm} />;
    }

    case "actions": {
      if (block.resolved) return null;
      return (
        <div className="flex flex-wrap gap-2 mt-1">
          {block.options.map((opt) => (
            <PrimaryButton key={opt.value} onClick={() => onActionSelect(opt.value, opt.label)}>
              {opt.label}
            </PrimaryButton>
          ))}
        </div>
      );
    }

    case "activity": {
      if (block.resolved) return null;
      return (
        <div className="bg-white border border-saffron-100 rounded-2xl p-3.5 animate-sadhna-in">
          {block.target && (
            <p className="text-[11px] font-semibold text-saffron-500 mb-1">📅 For {block.target.dateLabel}</p>
          )}
          <p className="text-sm font-medium text-saffron-900">
            {activityQuestionText(block.activity)}
          </p>
          {isFilled(block.suggestion) && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-saffron-600">
                {block.suggestionLabel || "Yesterday"}:{" "}
                <span className="font-medium">{formatValueForEcho(block.activity, block.suggestion)}</span>
              </span>
              <SecondaryButton onClick={() => onActivitySubmit(block.suggestion)}>
                Use this
              </SecondaryButton>
            </div>
          )}
          <ActivityQuestion activity={block.activity} onSubmit={onActivitySubmit} />
        </div>
      );
    }

    case "quickFillAll":
      if (block.resolved) return null;
      return (
        <QuickFillAllCard
          activities={block.activities}
          todayMap={todayMap}
          onActivitySubmit={onQuickFillActivitySubmit}
          onContinue={onQuickFillContinue}
          onAllDone={onQuickFillAllDone}
        />
      );

    case "marksCard":
      return (
        <MarksCard
          marksResponse={block.marksResponse}
          celebrate={block.celebrate}
          title={block.title}
          onSparkleDone={onSparkleDone}
        />
      );

    case "progressChart":
      return <ProgressChart data={block.data} />;

    case "pendingList":
      return (
        <div className="bg-white border border-saffron-100 rounded-2xl p-3.5 space-y-2 animate-sadhna-in">
          {block.activities.map((a) => (
            <div key={a.activity_id} className="flex items-center gap-2.5">
              <Sticker name="sprout" size={26} />
              <span className="text-sm text-saffron-900">{a.name}</span>
            </div>
          ))}
        </div>
      );

    case "yesterdaySnapshot":
      return (
        <div className="bg-white border border-saffron-100 rounded-2xl p-3.5 space-y-2 animate-sadhna-in">
          {block.records.map((r) => (
            <div key={r.activity_id} className="flex items-center justify-between text-sm">
              <span className="text-saffron-800">{r.activity_id.replace(/_/g, " ")}</span>
              <span className="font-medium text-saffron-900">
                {isFilled(r.value) ? String(r.value) : "Not recorded"}
              </span>
            </div>
          ))}
        </div>
      );

    case "nlConfirm":
      if (block.resolved) return null;
      return (
        <NLConfirmCard
          updates={block.updates}
          activitiesById={activitiesById}
          dateLabel={block.date && block.date !== todayISO() ? formatDateLabel(block.date) : undefined}
          onConfirm={onNlConfirm}
          onCorrect={onNlCorrect}
          onAskAI={block.sourceText ? onNlAskAI : undefined}
        />
      );

    default:
      return null;
  }
}

function activityQuestionText(activity) {
  const prompts = {
    chanting: "📿 How many rounds have you completed today?",
    chanting_completion_time: "📿 Haribol! Around what time did you complete your chanting?",
    wakeup: "🌅 When did you wake up today?",
    mangal_aarti: "🌅 Were you able to attend Mangala-arati today?",
    hearing: "🎧 How much hearing did you do today?",
    reading: "📖 How much reading did you do today?",
    day_rest: "😴 How much day rest did you take today?",
    sleep: "🌙 What time did you go to sleep?",
  };
  return prompts[activity.category] || `${activity.icon ? "" : "✨ "}How was your ${activity.name} today?`;
}

export default SadhnaChat;
