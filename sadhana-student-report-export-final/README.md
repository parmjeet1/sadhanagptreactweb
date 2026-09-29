# Sadhana Student Report Export

## Files

- `exportAnalytics.js`
  - Reusable analytics transformation.
  - Preserves subgroup-level ranking.
  - Preserves the existing average-marks rule: total marks divided by the selected date-list length.
  - Keeps `NULL` marks as missing instead of silently converting them to zero.
  - Adds `studentId` to daily rows.
  - Adds `dailyActivityData` for activity trends.

- `studentReportExport.js`
  - `exportBulkReportsToExcel()`
  - `exportBulkReportsToPDF()`

## Install

```bash
npm install exceljs jspdf jspdf-autotable
```

## Import

```js
import {
  exportBulkReportsToExcel,
  exportBulkReportsToPDF
} from "./studentReportExport";
```

## Excel

The workbook contains:

1. `Mentor Dashboard`
2. `Student Details`

Student names use native Excel hyperlinks, not `HYPERLINK()` formulas.

The follow-up field is a native Excel dropdown:

- In next 3 days
- In next 6 days
- Done

Activity trend images are generated per activity. Missing values are not converted to zero.

## PDF

The PDF contains:

- mentor dashboard
- student-level detail sections
- date-wise activity table
- activity trend charts
- priority / concern information

The PDF is generated directly with jsPDF instead of opening the browser print dialog.

## Important business-rule note

The source code currently assumes:

- Rank = rank within subgroup.
- Average marks = total marks / all dates in the selected subgroup/date range.
- Red = average below 60 or no Sadhna data.
- Yellow = activity variability detected.
- Green = no configured concern.

The priority thresholds are intentionally isolated in `priorityFor()` and `hasHighVariability()` so they can be changed without touching the export rendering.

## Integration

Your existing API call can remain the same:

```js
const res = await postRequest(
  "/export-bulk-student-reports",
  payload
);

const reportsData = res?.data?.data || [];

await exportBulkReportsToExcel(
  reportsData,
  `mentor_report_${startDate}_to_${endDate}.xlsx`,
  startDate,
  endDate
);

await exportBulkReportsToPDF(
  reportsData,
  exportDuration,
  `mentor_report_${startDate}_to_${endDate}.pdf`,
  startDate,
  endDate
);
```

## Notes

The Excel exporter is `.xlsx`, not the previous SpreadsheetML `.xls` implementation.

If your project already has an existing `computeGroupExportAnalytics`, either replace it with the supplied version or merge the two functions carefully. The exporter imports it from `./exportAnalytics`.
