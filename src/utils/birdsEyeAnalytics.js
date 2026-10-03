// birdsEyeAnalytics.js
//
// Reusable analysis engine for the mentor "Bird's Eye View" feature.
// Deliberately kept separate from utils/exportAnalytics.js (which powers the
// real Excel/PDF/CSV exports and must not be touched) but mirrors its proven
// rules — same per-row dedup key for "max possible marks" (date + activity
// id), same reliance on the backend's activity_marks / activity_max_possible_marks
// fields introduced for exportBulkStudentReports. Nothing here is specific to
// any one activity id/name; concern labels are derived from each mentee's
// OWN configured activity names, never a hard-coded id.
//
// Input rows are exactly the shape returned by POST /export-bulk-student-reports
// (see SadhanaGPT/Mentors/CounslerController.js -> exportBulkStudentReports):
//   { student_id, student_name, mobile, center_name, label_name,
//     activity_name, activity_id, activity_value, activity_marks,
//     activity_max_possible_marks, activity_date }
// A student with zero activity in the requested date range still gets one
// row (LEFT JOIN), with activity_name === 'No Logged Activity' and
// activity_date === '-' — that is how "Show EVERY mentee" / "No Data" is
// guaranteed without a separate mentee-list call.

// ---------------------------------------------------------------------------
// Single reusable configuration point — see spec section 14. Do not scatter
// these numbers through JSX; every classification decision reads from here.
// ---------------------------------------------------------------------------
export const BIRDS_EYE_CONFIG = {
  // A mentee must have reported on at least this fraction of the days in
  // the selected period to be eligible for GREEN/"Doing well", regardless
  // of how good their average marks are on the days they DID report. No
  // existing reporting-consistency threshold was found anywhere else in
  // the project (report/export code only computes marks %, never a
  // separate consistency ratio), so this is a new, explicit, sensible
  // default: 70% of the period's days.
  REPORTING_CONSISTENCY_THRESHOLD: 0.7,
  // Average marks (earned / max-possible, from the backend's marking-scheme
  // resolution) must be STRICTLY ABOVE this to be eligible for GREEN —
  // mirrors the exact ">55%" wording from the feature spec.
  GOOD_MARKS_THRESHOLD: 55,
  // At most this many concern labels are shown per struggling student.
  MAX_CONCERNS_SHOWN: 2,
};

// ---------------------------------------------------------------------------
// Previous completed week — mirrors the backend's OWN "week" convention
// exactly (SadhanaGPT/Controllers/SummaryData/summary-report.js,
// weeklySummaryUpdate()):
//   lastSunday = moment().day(0)          // the Sunday that starts the
//                                          // CURRENT calendar week — this is
//                                          // always today or a past date,
//                                          // never in the future.
//   lastMonday = lastSunday - 6 days
// Because "this week's Sunday" is always <= today, this always resolves to
// the most recently fully-completed Monday->Sunday week regardless of which
// day "today" happens to be — no off-by-one depending on today's weekday.
// Implemented here with local Date getters/setters only (never
// toISOString()/UTC conversion) specifically to avoid the timezone/off-by-
// one-day trap the spec calls out.
// ---------------------------------------------------------------------------
function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getPreviousCompletedWeekRange() {
  const now = new Date();
  const thisWeekSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  thisWeekSunday.setDate(thisWeekSunday.getDate() - thisWeekSunday.getDay()); // roll back to Sunday
  const lastMonday = new Date(thisWeekSunday);
  lastMonday.setDate(lastMonday.getDate() - 6);
  return {
    startDate: formatLocalDate(lastMonday),
    endDate: formatLocalDate(thisWeekSunday),
  };
}

// Inclusive day count between two YYYY-MM-DD strings, computed from local
// Y/M/D components (not a raw ms-diff on Date objects) so a DST transition
// inside the range can never shift the count by a day.
export function countPeriodDays(startDate, endDate) {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

export function formatDateRangeShort(startDate, endDate) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const startText = `${sd} ${months[sm - 1]}`;
  const endText = sy === ey ? `${ed} ${months[em - 1]} ${ey}` : `${ed} ${months[em - 1]} ${ey}`;
  return `${startText} – ${endText}`;
}

// ---------------------------------------------------------------------------
// Concern labels & recommended actions — a small, reusable, predefined
// library keyed off each activity's own configured NAME (never an id), per
// spec sections 15/18. Falls back to a generic "Low <activity name>" label
// for any custom activity that doesn't match a known keyword, so a
// counsellor's own custom activities are still covered without code changes.
// ---------------------------------------------------------------------------
function concernLabelForActivity(activityName) {
  const n = String(activityName || '').toLowerCase();
  if (n.includes('chant') && (n.includes('time') || n.includes('completion'))) return 'Late chanting completion';
  if (n.includes('chant') || n.includes('japa') || n.includes('mala')) return 'Low chanting consistency';
  if (n.includes('wake')) return 'Late wake-up';
  if (n.includes('hearing') || n.includes('lecture') || n.includes('class')) return 'Low hearing';
  if (n.includes('read') || n.includes('book') || n.includes('bhagavatam') || n.includes('gita')) return 'Low book reading';
  if (n.includes('mangal') || n.includes('aarti') || n.includes('arti')) return 'Low Mangal Aarti attendance';
  if (n.includes('rest') && !n.includes('sleep')) return 'High day rest';
  if (n.includes('sleep')) return 'Late sleep';
  return `Low ${activityName}`;
}

const RECOMMENDED_ACTION_LIBRARY = {
  'Irregular reporting': 'Encourage consistent daily reporting',
  'Not reporting': 'Follow up and encourage regular reporting',
  'Late wake-up': 'Discuss morning routine',
  'Low chanting consistency': 'Check obstacles to completing chanting',
  'Late chanting completion': 'Discuss morning routine and encourage earlier chanting',
  'Low hearing': 'Encourage regular hearing',
  'Low book reading': 'Encourage daily book reading',
  'Low Mangal Aarti attendance': 'Encourage attending Mangal Aarti',
  'High day rest': 'Discuss daily time management',
  'Late sleep': 'Discuss evening routine and encourage earlier sleep',
};

function actionForConcerns(concerns) {
  if (!concerns || concerns.length === 0) return 'Continue current routine';
  for (const c of concerns) {
    if (RECOMMENDED_ACTION_LIBRARY[c]) return RECOMMENDED_ACTION_LIBRARY[c];
  }
  return 'Discuss routine and encourage consistency';
}

// ---------------------------------------------------------------------------
// Main aggregation — one pass over the bulk export rows, per student.
// ---------------------------------------------------------------------------
export function analyzeBirdsEyeStudents(rows, periodDays) {
  const studentsMap = new Map();

  (rows || []).forEach((r) => {
    const studentId = String(r.student_id ?? r.user_id ?? r.student_name ?? 'unknown');
    if (!studentsMap.has(studentId)) {
      studentsMap.set(studentId, {
        id: studentId,
        name: r.student_name || 'Student',
        groupName: (r.center_name && r.center_name !== 'N/A') ? r.center_name : 'Unassigned Group',
        subgroupName: (r.label_name && r.label_name !== 'Uncategorized') ? r.label_name : 'No Subgroup',
        totalMarks: 0,
        totalMaxMarks: 0,
        maxKeysSeen: new Set(),
        datesReported: new Set(),
        perActivity: new Map(), // name -> { marks, max, keys: Set }
      });
    }

    const st = studentsMap.get(studentId);
    const actName = r.activity_name;
    const actDate = r.activity_date;
    const isRealRow = !!actDate && actDate !== '-' && !!actName && actName !== 'No Logged Activity';
    if (!isRealRow) return; // placeholder "no data" row — nothing to aggregate (spec section 5)

    st.datesReported.add(actDate);

    const marks = Number(r.activity_marks);
    const marksNum = Number.isFinite(marks) ? marks : 0;
    st.totalMarks += marksNum;

    if (!st.perActivity.has(actName)) st.perActivity.set(actName, { marks: 0, max: 0, keys: new Set() });
    const pa = st.perActivity.get(actName);
    pa.marks += marksNum;

    const maxRaw = Number(r.activity_max_possible_marks);
    const dedupKey = `${actDate}::${r.activity_id ?? actName}`;
    if (Number.isFinite(maxRaw) && maxRaw > 0) {
      if (!st.maxKeysSeen.has(dedupKey)) {
        st.maxKeysSeen.add(dedupKey);
        st.totalMaxMarks += maxRaw;
      }
      if (!pa.keys.has(dedupKey)) {
        pa.keys.add(dedupKey);
        pa.max += maxRaw;
      }
    }
  });

  return Array.from(studentsMap.values()).map((st) => classifyStudent(st, periodDays));
}

function classifyStudent(st, periodDays) {
  const loggedDays = st.datesReported.size;
  const avgMarksPct = st.totalMaxMarks > 0 ? (st.totalMarks / st.totalMaxMarks) * 100 : 0;
  const consistency = periodDays > 0 ? loggedDays / periodDays : 0;

  let status, color, concerns;

  if (loggedDays === 0) {
    status = 'no_data';
    color = 'red';
    concerns = ['Not reporting'];
  } else {
    const consistencyOk = consistency >= BIRDS_EYE_CONFIG.REPORTING_CONSISTENCY_THRESHOLD;
    const marksOk = avgMarksPct > BIRDS_EYE_CONFIG.GOOD_MARKS_THRESHOLD;

    if (consistencyOk && marksOk) {
      status = 'good';
      color = 'green';
      concerns = [];
    } else {
      status = 'struggling';
      color = 'amber';
      concerns = [];
      if (!consistencyOk) concerns.push('Irregular reporting');

      // Rank this student's OWN logged activities by how far below the
      // "good" threshold their marks ratio for that activity fell, and
      // surface the weakest ones as concise concern labels — never
      // inferred from total marks alone (spec section 15).
      const activityRatios = Array.from(st.perActivity.entries())
        .filter(([, v]) => v.max > 0)
        .map(([name, v]) => ({ name, ratio: v.marks / v.max }))
        .filter((a) => a.ratio <= BIRDS_EYE_CONFIG.GOOD_MARKS_THRESHOLD / 100)
        .sort((a, b) => a.ratio - b.ratio);

      for (const a of activityRatios) {
        if (concerns.length >= BIRDS_EYE_CONFIG.MAX_CONCERNS_SHOWN) break;
        const label = concernLabelForActivity(a.name);
        if (!concerns.includes(label)) concerns.push(label);
      }

      if (concerns.length === 0) {
        // Consistency and marks were both technically borderline but no
        // single activity crossed the per-activity threshold — still
        // struggling overall (didn't clear the GREEN bar), so say so
        // generically rather than showing an empty concern line.
        concerns.push('Below target performance');
      }
    }
  }

  const statusText = status === 'good' ? 'Doing well'
    : status === 'no_data' ? 'Not reporting'
    : concerns.slice(0, BIRDS_EYE_CONFIG.MAX_CONCERNS_SHOWN).join(' · ');

  return {
    id: st.id,
    name: st.name,
    groupName: st.groupName,
    subgroupName: st.subgroupName,
    status,       // 'good' | 'struggling' | 'no_data'
    color,        // 'green' | 'amber' | 'red'
    statusText,
    concerns,
    action: status === 'no_data' ? RECOMMENDED_ACTION_LIBRARY['Not reporting'] : actionForConcerns(concerns),
    loggedDays,
    periodDays,
    avgMarksPct: Number(avgMarksPct.toFixed(1)),
  };
}
