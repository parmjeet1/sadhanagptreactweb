// ---------------------------------------------------------------------------
// Delivery to ChatGPT.
//
// FIX: this used to CUT the prompt at 7000 characters and then send it, so for
// anything bigger than a couple of mentees ChatGPT silently received only the
// first few students. Now nothing is ever truncated:
//   * If the whole prompt fits in a link, it is sent in the link (auto-submit).
//   * Otherwise the FULL prompt is copied to the clipboard, ChatGPT opens with
//     a short "data coming" message, and an on-screen box shows the full text
//     with a Copy button (works even if the browser blocked the auto-copy).
// Returns { mode: 'url' | 'clipboard', copied: boolean, length }.
// ---------------------------------------------------------------------------
const MAX_ENCODED_URL_QUERY = 7000;

const copyText = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* fall through to legacy copy */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return !!ok;
  } catch (e) {
    return false;
  }
};

const showFullPromptBox = (fullPrompt, copied) => {
  try {
    const old = document.getElementById('sadhana-ai-fullprompt');
    if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.id = 'sadhana-ai-fullprompt';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.55);display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,sans-serif';
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff;width:100%;max-width:520px;border-radius:24px 24px 0 0;padding:20px;box-sizing:border-box;max-height:88vh;display:flex;flex-direction:column;gap:10px';
    const h = document.createElement('div');
    h.style.cssText = 'font-weight:800;font-size:16px;color:#0f172a';
    h.textContent = 'Full data ready for ChatGPT';
    const p = document.createElement('div');
    p.style.cssText = 'font-size:13px;color:#475569;line-height:1.4';
    p.textContent = (copied ? 'The complete data has been copied. ' : 'Tap "Copy Data n Paste to ChatGPT window" below. ')
      + 'It is too long to fit in a link, so in the ChatGPT tab paste it (long-press → Paste, or Ctrl+V) and send. '
      + `(${fullPrompt.length.toLocaleString()} characters — nothing is left out.)`;
    const ta = document.createElement('textarea');
    ta.readOnly = true;
    ta.value = fullPrompt;
    ta.style.cssText = 'width:100%;height:160px;font-size:11px;border:1px solid #e2e8f0;border-radius:12px;padding:8px;box-sizing:border-box';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px';
    const btnCss = 'flex:1;padding:12px;border-radius:999px;font-weight:700;font-size:14px;border:0;cursor:pointer';
    const copyBtn = document.createElement('button');
    copyBtn.style.cssText = btnCss + ';background:#1a73e8;color:#fff';
    copyBtn.textContent = 'Copy Data n Paste to ChatGPT window';
    copyBtn.onclick = async () => {
      const ok = await copyText(fullPrompt);
      if (!ok) { ta.focus(); ta.select(); }
      copyBtn.textContent = ok ? 'Copied ✓' : 'Select all & copy manually';
    };
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = btnCss + ';background:#f1f5f9;color:#334155';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => wrap.remove();
    row.appendChild(copyBtn);
    row.appendChild(closeBtn);
    box.appendChild(h); box.appendChild(p); box.appendChild(ta); box.appendChild(row);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
  } catch (e) { /* UI helper only */ }
};

export const openChatGPTWithPrompt = async (fullPrompt, newWin = null) => {
  const encodedFull = encodeURIComponent(fullPrompt);
  const go = (url) => {
    if (newWin && !newWin.closed) newWin.location.href = url;
    else window.open(url, '_blank');
  };

  if (encodedFull.length <= MAX_ENCODED_URL_QUERY) {
    // Fits: send everything in the link. Also keep a clipboard copy.
    copyText(fullPrompt);
    go(`https://chatgpt.com/?hints=search&q=${encodedFull}`);
    return { mode: 'url', copied: true, length: fullPrompt.length };
  }

  const copied = await copyText(fullPrompt);
  //const short = 'I am about to paste Sadhana performance data (with analysis instructions) in my next message. Please wait for it, then follow the instructions in it. (Paste now: long-press → Paste, or Ctrl+V, then send.)';
  const short = 'Please paste the data here for analysis. It is already copied. If not copied, please copy from SadhnaGPT window';
  go(`https://chatgpt.com/?hints=search&q=${encodeURIComponent(short)}`);
  showFullPromptBox(fullPrompt, copied);
  return { mode: 'clipboard', copied, length: fullPrompt.length };
};

const NUM_RE = /^-?\d+(\.\d+)?$/;
const TIME_RE = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i;
const round1 = (n) => Math.round(n * 10) / 10;
const toMinutes = (v) => {
  const m = String(v).trim().match(TIME_RE);
  if (!m) return null;
  let h = parseInt(m[1], 10); const mi = parseInt(m[2], 10); const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + mi;
};
const fmtMinutes = (t) => `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(Math.round(t % 60)).padStart(2, '0')}`;
const daysBetween = (a, b) => {
  const d = (new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000;
  return Number.isFinite(d) ? Math.max(1, Math.round(d) + 1) : null;
};

/**
 * Text for many mentees, built from /export-bulk-student-reports rows. Nobody
 * is dropped — mentees with no logs are listed as such.
 *  - 'daily'   : one line per student per day ("Activity value(marks)").
 *  - 'summary' : one line per student per activity (average value, average
 *                marks, days logged) — about 5-10x smaller, used for long
 *                date ranges / big groups so the whole group fits in ChatGPT's
 *                context window.
 *  - 'auto' (default): summary when the range is over 7 days OR the daily
 *                text would be over ~12,000 characters, else daily.
 */
export const buildCompactStudentData = (rows = [], opts = {}) => {
  const { startDate, endDate, mode = 'auto' } = opts;
  const students = new Map();
  rows.forEach((row) => {
    const key = row.student_id ?? row.student_name ?? 'Student';
    if (!students.has(key)) {
      students.set(key, { name: row.student_name || 'Student', group: row.center_name || 'N/A', sub: row.label_name || 'Uncategorized', days: new Map(), acts: new Map() });
    }
    const st = students.get(key);
    const hasLog = row.activity_date && row.activity_date !== '-' && row.activity_name && row.activity_name !== 'No Logged Activity';
    if (!hasLog) return;
    if (!st.days.has(row.activity_date)) st.days.set(row.activity_date, []);
    st.days.get(row.activity_date).push(`${row.activity_name} ${row.activity_value ?? ''}(${row.activity_marks ?? 0})`);
    if (!st.acts.has(row.activity_name)) st.acts.set(row.activity_name, { vals: [], marks: [], dates: new Set() });
    const ac = st.acts.get(row.activity_name);
    ac.vals.push(row.activity_value); ac.marks.push(Number(row.activity_marks) || 0); ac.dates.add(row.activity_date);
  });

  const buildDaily = () => {
    const lines = ['Format: Date: Activity value(marks), ...'];
    let i = 0;
    students.forEach((st) => {
      i += 1;
      lines.push(`\nMentee #${i}: ${st.name} | Group: ${st.group} | Sub-Group: ${st.sub}`);
      if (st.days.size === 0) lines.push('  No activity logged in this period');
      else [...st.days.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).forEach(([d, acts]) => lines.push(`  ${d}: ${acts.join(', ')}`));
    });
    return lines.join('\n');
  };

  const buildSummary = () => {
    const total = startDate && endDate ? daysBetween(startDate, endDate) : null;
    const lines = [`SUMMARY MODE (period totals per mentee; values are averages over the days the activity was logged)${total ? ` — period length ${total} days` : ''}.`,
      'Format: Activity: avg value | avg marks | days logged'];
    let i = 0;
    students.forEach((st) => {
      i += 1;
      const activeDays = st.days.size;
      lines.push(`\nMentee #${i}: ${st.name} | Group: ${st.group} | Sub-Group: ${st.sub} | Days with any log: ${activeDays}${total ? '/' + total : ''}`);
      if (st.acts.size === 0) { lines.push('  No activity logged in this period'); return; }
      st.acts.forEach((ac, name) => {
        const nums = ac.vals.filter((v) => NUM_RE.test(String(v).trim())).map(Number);
        const times = ac.vals.map(toMinutes).filter((v) => v !== null);
        let avg;
        if (nums.length === ac.vals.length) avg = String(round1(nums.reduce((x, y) => x + y, 0) / nums.length));
        else if (times.length === ac.vals.length) avg = fmtMinutes(times.reduce((x, y) => x + y, 0) / times.length);
        else avg = [...new Set(ac.vals.map((v) => String(v)))].slice(0, 3).join('/');
        const am = round1(ac.marks.reduce((x, y) => x + y, 0) / ac.marks.length);
        lines.push(`  ${name}: ${avg} | ${am} | ${ac.dates.size}d`);
      });
    });
    return lines.join('\n');
  };

  const range = startDate && endDate ? daysBetween(startDate, endDate) : null;
  let text; let used;
  if (mode === 'summary' || (mode === 'auto' && range && range > 7)) { text = buildSummary(); used = 'summary'; }
  else {
    text = buildDaily(); used = 'daily';
    if (mode === 'auto' && text.length > 12000) { text = buildSummary(); used = 'summary'; }
  }
  return { text, studentCount: students.size, mode: used };
};

/**
 * Calculates start and end dates based on user preset or custom selection
 */
export const getDateRangeForPreset = (preset, customFrom = '', customTo = '') => {
  const today = new Date();
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const endDate = formatDate(today);

  if (preset === 'TODAY') {
    return { startDate: endDate, endDate, apiFilter: 'today' };
  }

  if (preset === 'LAST_7_DAYS' || preset === '7DAYS') {
    const from = new Date(today);
    from.setDate(today.getDate() - 6);
    return { startDate: formatDate(from), endDate, apiFilter: '7days' };
  }

  if (preset === 'MONTHLY' || preset === '30DAYS') {
    const from = new Date(today);
    from.setDate(today.getDate() - 29);
    return { startDate: formatDate(from), endDate, apiFilter: '30days' };
  }

  if (preset === 'CUSTOM') {
    return { 
      startDate: customFrom || endDate, 
      endDate: customTo || endDate, 
      apiFilter: 'custom' 
    };
  }

  return { startDate: endDate, endDate, apiFilter: 'custom' };
};

/**
 * Builds standard structured Sadhana prompt for ChatGPT analysis
 */
export const SADHANA_INSTRUCTIONS = (startDate, endDate) => `Analyze the following Sadhna performance data. If there is ONE person, use INDIVIDUAL MODE; if MULTIPLE people, use MENTOR MODE. Do not repeat the raw data. For ${startDate} to ${endDate} 
   RULES
- Analyze any date range, including 1–2 days. For short periods describe observations, not long-term trends.
- Distinguish a short selected range from sparse reporting within a longer range.
- Missing/"No Logged Activity" = not reported, NOT Sadhna not performed.
- Marks are app scores, not spiritual advancement. Use actual activity values, consistency and reporting for conclusions.
- Flag suspicious values as data-quality issues rather than interpreting them.
- If evidence is inadequate, say "Insufficient data".
- Be concise, encouraging, practical and non-judgmental.
INDIVIDUAL MODE

## 🌱 My Sadhna Progress
| Area | Pattern | Status |
Use: 🟢 Going well | 🟡 Can improve | 🟠 Needs attention | ⚪ Insufficient data

## What is going well
2–3 brief strengths.

## Areas to work on
Only 2–3 important practice/reporting concerns.

## My next steps
2–4 specific, realistic actions.

## Data to check
ONLY if suspicious values exist.

MENTOR MODE

## 👥 Group Progress
| Mentee | Reporting | Overall Pattern | Strong Area | Main Concern | Priority |
Use: 🔴 High | 🟡 Medium | 🟢 Low | ⚪ Insufficient data
Priority = need for mentor follow-up, NOT spiritual standing.

## Group summary
3–5 key insights on reporting, strengths and recurring concerns.

## Concern areas
Briefly cover relevant reporting, practice and data-quality concerns.

## Scope for improvement
Give specific, realistic improvements.

## Mentor actions
State who needs follow-up first and why, what to discuss, who can be monitored, and what data needs verification.

Keep the whole analysis readable in 1–2 minutes. Do not add sections or reproduce the input.

`;

export const buildSadhanaPrompt = ({
  contextName = 'Mentee Sadhana Analysis',
  startDate,
  endDate,
  studentCount = null,
  dataText = ''
}) => {
  return `${SADHANA_INSTRUCTIONS(startDate, endDate)}SADHANA PERFORMANCE DATA (${startDate} to ${endDate}):
Context: ${contextName}${studentCount ? ` | Total Mentees: ${studentCount}` : ''}

${dataText || 'No specific activity logs recorded in this period.'}

`;
};

// ---------------------------------------------------------------------------
// Splitting for big groups. Tunable: rough guide is ~3.5 characters per token.
//  * SINGLE_PROMPT_MAX_CHARS: up to this size it is ONE message (as before).
//  * PART_DATA_CHARS: target data size per part when it has to be split.
// Parts never cut a mentee in half. Instructions are sent ONCE (part 1); later
// parts carry only a one-line label + data, and only the last part asks for the
// combined analysis.
// ---------------------------------------------------------------------------
export const SINGLE_PROMPT_MAX_CHARS = 18000;
export const PART_DATA_CHARS = 10000;

const splitDataBlocks = (dataText) => {
  const idx = dataText.search(/\n?Mentee #\d+:/);
  if (idx >= 0) {
    const header = dataText.slice(0, idx).trim();
    const blocks = dataText.slice(idx).split(/\n(?=\s*Mentee #\d+:)/).map((b) => b.trim()).filter(Boolean);
    return { header, blocks };
  }
  return { header: '', blocks: dataText.split(/\n{2,}/).filter(Boolean) };
};

export const buildSadhanaParts = ({ contextName, startDate, endDate, studentCount = null, dataText = '' }) => {
  const single = buildSadhanaPrompt({ contextName, startDate, endDate, studentCount, dataText });
  if (single.length <= SINGLE_PROMPT_MAX_CHARS) return [single];

  const { header, blocks } = splitDataBlocks(dataText);
  const groups = [];
  let cur = []; let len = 0;
  blocks.forEach((b) => {
    if (cur.length && len + b.length > PART_DATA_CHARS) { groups.push(cur); cur = []; len = 0; }
    cur.push(b); len += b.length + 2;
  });
  if (cur.length) groups.push(cur);
  const n = groups.length;
  if (n <= 1) return [single];

  return groups.map((g, i) => {
    const k = i + 1;
    const body = (i === 0 && header ? header + '\n\n' : '') + g.join('\n\n');
    const ack = k < n
      ? `\n\n[End of part ${k} of ${n}. Reply ONLY with "Received part ${k} of ${n}" — do not analyze yet.]`
      : `\n\n[This was the FINAL part (${n} of ${n}). Now analyze ALL ${n} parts together, as one combined analysis, following the instructions in part 1.]`;
    if (i === 0) {
      return `THIS ANALYSIS IS SENT IN ${n} PARTS (too much data for one message). Do NOT analyze until I send the final part (part ${n}). After each part reply only "Received part k of ${n}".\n\n`
        + `${SADHANA_INSTRUCTIONS(startDate, endDate)}SADHANA PERFORMANCE DATA (${startDate} to ${endDate}) — PART 1 of ${n}:\nContext: ${contextName}${studentCount ? ` | Total Mentees (all parts): ${studentCount}` : ''}\n\n${body}${ack}`;
    }
    return `PART ${k} of ${n} — continuation of the same Sadhana data (instructions were in part 1).\n\n${body}${ack}`;
  });
};

export const openChatGPTWithParts = async (parts, newWin = null) => {
  if (!parts || parts.length <= 1) return openChatGPTWithPrompt(parts && parts[0] ? parts[0] : '', newWin);
  const first = parts[0];
  const enc = encodeURIComponent(first);
  const go = (url) => { if (newWin && !newWin.closed) newWin.location.href = url; else window.open(url, '_blank'); };
  let sentByLink = false;
  let copied = false;
  if (enc.length <= MAX_ENCODED_URL_QUERY) {
    go(`https://chatgpt.com/?hints=search&q=${enc}`);
    sentByLink = true;
    copied = await copyText(parts[1]);
  } else {
    copied = await copyText(first);
    const short = `I will paste ${parts.length} parts of Sadhana performance data, one message at a time. Wait for part 1 (paste it now: long-press → Paste, or Ctrl+V, then send).`;
    go(`https://chatgpt.com/?hints=search&q=${encodeURIComponent(short)}`);
  }
  showPartsBox(parts, sentByLink);
  return { mode: 'parts', copied, parts: parts.length };
};

const showPartsBox = (parts, firstSentByLink) => {
  try {
    const old = document.getElementById('sadhana-ai-fullprompt');
    if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.id = 'sadhana-ai-fullprompt';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.55);display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,sans-serif';
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff;width:100%;max-width:520px;border-radius:24px 24px 0 0;padding:20px;box-sizing:border-box;max-height:88vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px';
    const h = document.createElement('div');
    h.style.cssText = 'font-weight:800;font-size:16px;color:#0f172a';
    h.textContent = `Send in ${parts.length} parts — one combined analysis`;
    const p = document.createElement('div');
    p.style.cssText = 'font-size:13px;color:#475569;line-height:1.45';
    p.textContent = (firstSentByLink
      ? 'Part 1 was sent to ChatGPT automatically. '
      : 'In ChatGPT, paste part 1 (already copied) and send. ')
      + 'ChatGPT will reply "Received part…". Then come back here, tap the next part\'s Copy button, paste it in the SAME chat and send. Repeat until the last part — ChatGPT then gives one analysis of everything.';
    box.appendChild(h); box.appendChild(p);
    const btnCss = 'padding:12px;border-radius:999px;font-weight:700;font-size:14px;border:0;cursor:pointer;';
    parts.forEach((part, i) => {
      const b = document.createElement('button');
      b.style.cssText = btnCss + 'background:#1a73e8;color:#fff;text-align:center';
      const label = `Copy part ${i + 1} of ${parts.length} and paste in the ChatGPT window`;
      b.textContent = (i === 0 && firstSentByLink) ? `Part 1 already sent to ChatGPT (tap to copy again)` : label;
      b.onclick = async () => {
        const ok = await copyText(part);
        b.textContent = ok ? `Copied part ${i + 1} ✓ — now paste it in the ChatGPT window and send` : 'Copy failed — try again';
        b.style.background = ok ? '#16a34a' : '#dc2626';
      };
      box.appendChild(b);
    });
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = btnCss + 'background:#f1f5f9;color:#334155';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => wrap.remove();
    box.appendChild(closeBtn);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
  } catch (e) { /* UI helper only */ }
};
