/**
 * Directly passes the full prompt to ChatGPT via URL parameter `?hints=search&q=...`
 * so it automatically submits into the ChatGPT chat thread and clears the input box.
 */
export const openChatGPTWithPrompt = (fullPrompt, newWin = null) => {
  // Ensure prompt fits smoothly in query parameter (URL limit ~7500 chars)
  let promptForUrl = fullPrompt;
  if (promptForUrl.length > 7000) {
    promptForUrl = promptForUrl.substring(0, 7000) + "\n\n[Data formatted for direct ChatGPT chat input]";
  }

  // Open ChatGPT with hints=search to auto-submit and clear the input textarea
  const chatGptUrl = `https://chatgpt.com/?hints=search&q=${encodeURIComponent(promptForUrl)}`;

  if (newWin && !newWin.closed) {
    newWin.location.href = chatGptUrl;
  } else {
    window.open(chatGptUrl, '_blank');
  }
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
export const buildSadhanaPrompt = ({
  contextName = 'Mentee Sadhana Analysis',
  startDate,
  endDate,
  studentCount = null,
  dataText = ''
}) => {
  return `Analyze the following Sadhna performance data. If there is ONE person, use INDIVIDUAL MODE; if MULTIPLE people, use MENTOR MODE. Do not repeat the raw data. For ${startDate} to ${endDate} 
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

SADHANA PERFORMANCE DATA (${startDate} to ${endDate}):
Context: ${contextName}${studentCount ? ` | Total Mentees: ${studentCount}` : ''}

${dataText || 'No specific activity logs recorded in this period.'}

`;
};
