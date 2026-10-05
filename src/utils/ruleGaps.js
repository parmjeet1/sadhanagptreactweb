// Finds whole-number values that NO rule of an activity covers (e.g. rules for "5 or more" and
// "0" leave 1-4 uncovered). An entry that matches no rule earns nothing, which students then
// read as "marks are broken". Only number-type activities (rounds / minutes / counts) are checked.

const NUMBER_UNITS = new Set(['numb', 'min', 'rounds']);

const matches = (operator, value, threshold) => {
  switch (operator) {
    case '>': return value > threshold;
    case '<': return value < threshold;
    case '>=': return value >= threshold;
    case '<=': return value <= threshold;
    case '=':
    case '==': return value === threshold;
    case '!=': return value !== threshold;
    default: return false;
  }
};

const MAX_SCAN = 5000;

/**
 * @param {Array<{operator: string, value: string|number}>} rows the rows of one activity
 * @param {string} unit  numb | min | rounds | time | yes_no ...
 * @returns {Array<string>} readable gaps, e.g. ["1-4"] or ["6 and above"]; [] when there are none (or not checkable)
 */
export const findRuleGaps = (rows, unit) => {
  if (!NUMBER_UNITS.has(unit)) return [];
  const rules = (rows || [])
    .map((r) => ({ operator: r.operator, threshold: r.value === '' || r.value === null || r.value === undefined ? NaN : Number(r.value) }))
    .filter((r) => r.operator && Number.isFinite(r.threshold));
  if (rules.length === 0) return [];

  const top = Math.min(Math.max(...rules.map((r) => Math.ceil(r.threshold))) + 1, MAX_SCAN);
  const gaps = [];
  let start = null;
  for (let v = 0; v <= top; v += 1) {
    const covered = rules.some((r) => matches(r.operator, v, r.threshold));
    if (!covered && start === null) start = v;
    if (covered && start !== null) {
      gaps.push(start === v - 1 ? `${start}` : `${start}-${v - 1}`);
      start = null;
    }
  }
  if (start !== null) gaps.push(`${start} and above`);
  return gaps;
};
