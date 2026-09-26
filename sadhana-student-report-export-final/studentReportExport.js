// studentReportExport.js
//
// Dependencies:
//   npm i exceljs jspdf jspdf-autotable
//
// Usage:
//   import {
//     exportBulkReportsToExcel,
//     exportBulkReportsToPDF
//   } from "./studentReportExport";
//
// Both functions are browser/client-side exports.
// The same computed analytics drives Excel and PDF.

import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { computeGroupExportAnalytics } from "./exportAnalytics";

const COLORS = {
  navy: "1F4E78",
  blue: "C6D9F8",
  lightBlue: "D9E1F2",
  green: "D9EAD3",
  greenText: "274E13",
  yellow: "FFF2CC",
  yellowText: "B45F06",
  red: "FCE5CD",
  redText: "CC0000",
  gray: "F2F2F2",
  border: "D9D9D9",
  white: "FFFFFF",
  black: "000000"
};

const NO_VALUE = "-";

export async function exportBulkReportsToExcel(
  reportsData,
  filename = "sadhana-student-report.xlsx",
  explicitStartDate,
  explicitEndDate
) {
  if (!Array.isArray(reportsData) || !reportsData.length) {
    throw new Error("No report data available for Excel export.");
  }

  const analytics = computeGroupExportAnalytics(
    reportsData,
    explicitStartDate,
    explicitEndDate
  );

  const students = flattenStudents(analytics.processedGroups);
  const activities = uniqueActivities(students);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SadhanaGPT";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties.date1904 = false;

  const dashboard = workbook.addWorksheet("Mentor Dashboard", {
    views: [{ state: "frozen", ySplit: 5 }]
  });

  const details = workbook.addWorksheet("Student Details", {
    views: [{ state: "frozen", ySplit: 5 }]
  });

  buildDashboard(
    dashboard,
    students,
    activities,
    analytics
  );

  buildStudentDetails(
    details,
    students,
    activities,
    analytics
  );

  const buffer = await workbook.xlsx.writeBuffer();

  downloadBlob(
    new Blob([buffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    ensureExtension(filename, ".xlsx")
  );
}

export async function exportBulkReportsToPDF(
  reportsData,
  durationLabel = "",
  filename = "sadhana-student-report.pdf",
  explicitStartDate,
  explicitEndDate
) {
  if (!Array.isArray(reportsData) || !reportsData.length) {
    throw new Error("No report data available for PDF export.");
  }

  const analytics = computeGroupExportAnalytics(
    reportsData,
    explicitStartDate,
    explicitEndDate
  );

  const students = flattenStudents(analytics.processedGroups);
  const activities = uniqueActivities(students);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const dashboardPages = [];
  const studentPages = [];

  // Dashboard
  addPdfTitle(
    doc,
    "Sadhana Performance Report",
    analytics,
    durationLabel
  );

  const dashboardRows = students.map((student) => [
    student.rank ?? "-",
    student.name,
    student.groupName,
    student.subgroupName,
    `${student.avgMarks.toFixed(2)}%`,
    student.loggedDays,
    priorityFor(student).level.toUpperCase(),
    priorityFor(student).reason,
    "Pending"
  ]);

  autoTable(doc, {
    head: [[
      "Rank",
      "Student",
      "Group",
      "Subgroup",
      "Average Marks",
      "Days Reported",
      "Priority",
      "Main Concern",
      "Next Follow-up"
    ]],
    body: dashboardRows,
    startY: 38,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      valign: "middle"
    },
    headStyles: {
      fillColor: hexToRgb(COLORS.blue),
      textColor: [0, 0, 0],
      fontStyle: "bold"
    },
    didParseCell(data) {
      if (
        data.section === "body" &&
        data.column.index === 6
      ) {
        const level = String(data.cell.raw || "").toLowerCase();

        if (level === "GREEN") {
          data.cell.styles.fillColor =
            hexToRgb(COLORS.green);
          data.cell.styles.textColor =
            hexToRgb(COLORS.greenText);
        }

        if (level === "YELLOW") {
          data.cell.styles.fillColor =
            hexToRgb(COLORS.yellow);
          data.cell.styles.textColor =
            hexToRgb(COLORS.yellowText);
        }

        if (level === "RED") {
          data.cell.styles.fillColor =
            hexToRgb(COLORS.red);
          data.cell.styles.textColor =
            hexToRgb(COLORS.redText);
        }
      }
    }
  });

  dashboardPages.push(doc.internal.getNumberOfPages());

  // Student details
  students.forEach((student, index) => {
    doc.addPage();
    studentPages.push(doc.internal.getNumberOfPages());

    addStudentPdfSection(
      doc,
      student,
      activities
    );

    if (index < students.length - 1) {
      doc.setDrawColor(210, 210, 210);
      doc.line(
        12,
        193,
        285,
        193
      );
    }
  });

  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Page ${page} of ${pageCount}`,
      285,
      202,
      { align: "right" }
    );
  }

  doc.save(
    ensureExtension(filename, ".pdf")
  );
}

function buildDashboard(
  ws,
  students,
  activities,
  analytics
) {
  const title = "Sadhana Performance Dashboard";

  ws.mergeCells(
    `A1:${columnLetter(9 + activities.length)}1`
  );

  const titleCell = ws.getCell("A1");
  titleCell.value = title;
  titleCell.font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: { argb: COLORS.white }
  };
  titleCell.fill = solidFill(COLORS.navy);
  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle"
  };

  ws.getRow(1).height = 28;

  ws.mergeCells(
    `A2:${columnLetter(9 + activities.length)}2`
  );

  const meta = ws.getCell("A2");
  meta.value =
    `Date Range: ${formatDate(analytics.overallMinDate)} to ${formatDate(analytics.overallMaxDate)}`;
  meta.font = {
    size: 10,
    color: { argb: "64748B" }
  };

  ws.mergeCells(
    `A3:${columnLetter(9 + activities.length)}3`
  );

  const note = ws.getCell("A3");
  note.value =
    "Click a student name to open the Student Details sheet. Follow-up is an editable dropdown.";
  note.font = {
    size: 9,
    italic: true,
    color: { argb: "64748B" }
  };

  const headers = [
    "Rank",
    "Student Name",
    "Group",
    "Subgroup",
    "Average Marks",
    "Days Reported",
    "Main Concern",
    "Mentor Action",
    "Next Follow-up",
    ...activities.map(
      (activity) => `${activity} Avg`
    )
  ];

  const headerRow = ws.getRow(5);

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    styleHeader(cell);
  });

  students.forEach((student, index) => {
    const rowNumber = 6 + index;
    const row = ws.getRow(rowNumber);
    const priority = priorityFor(student);

    const values = [
      student.rank ?? "-",
      student.name,
      student.groupName,
      student.subgroupName,
      student.avgMarks,
      student.loggedDays,
      priority.reason,
      mentorActionFor(priority),
      "",
      ...activities.map(
        (activity) =>
          student.activityAverages?.[activity] ?? "-"
      )
    ];

    values.forEach((value, index) => {
      row.getCell(index + 1).value = value;
      styleBodyCell(row.getCell(index + 1));
    });

    // Native Excel hyperlink — no HYPERLINK formula.
    const nameCell = row.getCell(2);

    nameCell.value = {
      text: student.name,
      hyperlink: `#'Student Details'!A${student.detailRow}`
    };

    nameCell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      underline: true,
      color: { argb: "0563C1" }
    };

    row.getCell(5).numFmt = "0.00%";

    // Stored avgMarks is already a percentage number, e.g. 82.35.
    row.getCell(5).value =
      Number(student.avgMarks) / 100;

    row.getCell(9).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [
        '"In next 3 days,In next 6 days,Done"'
      ]
    };

    applyPriorityStyle(
      row.getCell(7),
      priority.level
    );
  });

  const widths = [
    8,
    24,
    18,
    18,
    16,
    15,
    30,
    30,
    20,
    ...activities.map(() => 17)
  ];

  widths.forEach((width, index) => {
    ws.getColumn(index + 1).width = width;
  });

  ws.autoFilter = {
    from: "A5",
    to: `${columnLetter(headers.length)}${Math.max(
      5,
      5 + students.length
    )}`
  };
}

function buildStudentDetails(
  ws,
  students,
  activities,
  analytics
) {
  ws.getColumn(1).width = 16;
  ws.getColumn(2).width = 24;

  activities.forEach((_, index) => {
    ws.getColumn(3 + index).width = 17;
  });

  let row = 1;

  students.forEach((student) => {
    student.detailRow = row;

    const lastColumn =
      Math.max(2, 2 + activities.length);

    ws.mergeCells(
      `A${row}:${columnLetter(lastColumn)}${row}`
    );

    const title = ws.getCell(`A${row}`);
    title.value = student.name;
    title.font = {
      size: 16,
      bold: true,
      color: { argb: COLORS.white }
    };
    title.fill = solidFill(COLORS.navy);
    title.alignment = {
      horizontal: "left",
      vertical: "middle"
    };

    ws.getRow(row).height = 26;
    row += 1;

    const info = [
      ["Group", student.groupName],
      ["Subgroup", student.subgroupName],
      ["Rank", student.rank ?? "-"],
      ["Average Marks", `${student.avgMarks.toFixed(2)}%`],
      ["Days Reported", student.loggedDays]
    ];

    info.forEach(([label, value]) => {
      ws.getCell(`A${row}`).value = label;
      ws.getCell(`A${row}`).font = {
        bold: true
      };

      ws.getCell(`B${row}`).value = value;

      ws.getCell(`A${row}`).fill =
        solidFill(COLORS.lightBlue);

      ws.getCell(`B${row}`).fill =
        solidFill(COLORS.gray);

      row++;
    });

    ws.getCell(`A${row}`).value = {
      text: "← Back to Mentor Dashboard",
      hyperlink: "#'Mentor Dashboard'!A1"
    };

    ws.getCell(`A${row}`).font = {
      bold: true,
      underline: true,
      color: { argb: "0563C1" }
    };

    row += 2;

    const tableHeaderRow = row;

    const headers = [
      "Date",
      ...activities
    ];

    headers.forEach((header, index) => {
      const cell =
        ws.getCell(
          tableHeaderRow,
          index + 1
        );

      cell.value = header;
      styleHeader(cell);
    });

    row++;

    const dates = studentDates(
      student,
      analytics
    );

    dates.forEach((date) => {
      ws.getCell(`A${row}`).value =
        formatDate(date);

      ws.getCell(`A${row}`).alignment = {
        horizontal: "center"
      };

      activities.forEach((activity, index) => {
        const value =
          findActivityValue(
            student,
            activity,
            date
          );

        const cell =
          ws.getCell(
            row,
            index + 2
          );

        if (value === null || value === undefined) {
          cell.value = NO_VALUE;
        } else if (
          typeof value === "number"
        ) {
          cell.value = value;
        } else {
          cell.value = value;
        }

        styleBodyCell(cell);
        cell.alignment = {
          horizontal: "center"
        };
      });

      row++;
    });

    if (!dates.length) {
      ws.getCell(`A${row}`).value =
        "No activity logged in this period.";
      row += 1;
    }

    row += 1;

    ws.getCell(`A${row}`).value =
      "Activity averages";
    ws.getCell(`A${row}`).font = {
      bold: true,
      size: 12
    };

    row += 1;

    activities.forEach((activity, index) => {
      ws.getCell(row, index + 1).value =
        activity;
      ws.getCell(row, index + 1).font = {
        bold: true
      };

      ws.getCell(row, index + 2).value =
        student.activityAverages?.[activity] ??
        NO_VALUE;

      styleBodyCell(
        ws.getCell(row, index + 2)
      );
    });

    row += 2;

    // Add a native Excel-friendly trend image.
    // Each image contains exactly one activity series.
    activities.forEach((activity) => {
      const points = dates
        .map((date) => ({
          date,
          value: findNumericActivityValue(
            student,
            activity,
            date
          )
        }))
        .filter(
          (point) =>
            point.value !== null &&
            Number.isFinite(point.value)
        );

      if (points.length < 2) return;

      const image = createTrendChartDataUrl(
        points,
        activity
      );

      const imageId =
        ws.workbook.addImage({
          base64: image,
          extension: "png"
        });

      ws.addImage(imageId, {
        tl: {
          col: 0,
          row
        },
        ext: {
          width: 620,
          height: 230
        }
      });

      row += 13;
    });

    row += 2;
  });
}

function addStudentPdfSection(
  doc,
  student,
  activities
) {
  doc.setFontSize(17);
  doc.setTextColor(20, 35, 60);
  doc.text(
    student.name,
    12,
    15
  );

  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);

  doc.text(
    `Group: ${student.groupName}   |   Subgroup: ${student.subgroupName}   |   Rank: #${student.rank ?? "-"}   |   Average: ${student.avgMarks.toFixed(2)}%`,
    12,
    22
  );

  const priority = priorityFor(student);

  doc.text(
    `Days reported: ${student.loggedDays}   |   Priority: ${priority.level.toUpperCase()}   |   ${priority.reason}`,
    12,
    28
  );

  const dates = studentDatesFromStudent(student);

  const tableRows = dates.map((date) => [
    formatDate(date),
    ...activities.map(
      (activity) =>
        findActivityValue(
          student,
          activity,
          date
        ) ?? "-"
    )
  ]);

  autoTable(doc, {
    head: [[
      "Date",
      ...activities
    ]],
    body: tableRows,
    startY: 34,
    styles: {
      fontSize: 6.5,
      cellPadding: 1.5
    },
    headStyles: {
      fillColor: hexToRgb(COLORS.blue),
      textColor: [0, 0, 0]
    }
  });

  let y =
    (doc.lastAutoTable?.finalY || 40) + 8;

  doc.setFontSize(10);
  doc.setTextColor(20, 35, 60);
  doc.text(
    "Activity Trends",
    12,
    y
  );

  y += 5;

  const chartWidth = 128;
  const chartHeight = 48;
  let chartX = 12;
  let chartY = y;

  activities.forEach((activity) => {
    const points = dates
      .map((date) => ({
        date,
        value: findNumericActivityValue(
          student,
          activity,
          date
        )
      }))
      .filter(
        (point) =>
          point.value !== null &&
          Number.isFinite(point.value)
      );

    if (points.length < 2) return;

    if (chartX + chartWidth > 285) {
      chartX = 12;
      chartY += chartHeight + 12;
    }

    if (chartY + chartHeight > 190) {
      doc.addPage();
      chartX = 12;
      chartY = 20;
    }

    drawPdfLineChart(
      doc,
      points,
      activity,
      chartX,
      chartY,
      chartWidth,
      chartHeight
    );

    chartX += chartWidth + 8;
  });
}

function addPdfTitle(
  doc,
  title,
  analytics,
  durationLabel
) {
  doc.setFontSize(18);
  doc.setTextColor(20, 35, 60);
  doc.text(title, 12, 16);

  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);

  const range =
    `Date Range: ${formatDate(analytics.overallMinDate)} to ${formatDate(analytics.overallMaxDate)}`;

  doc.text(
    durationLabel
      ? `${range}   |   ${durationLabel}`
      : range,
    12,
    23
  );
}

function drawPdfLineChart(
  doc,
  points,
  title,
  x,
  y,
  width,
  height
) {
  const pad = 7;
  const chartX = x + pad;
  const chartY = y + 10;
  const chartW = width - pad * 2;
  const chartH = height - 18;

  const values = points.map((p) =>
    Number(p.value)
  );

  const min =
    Math.min(...values);
  const max =
    Math.max(...values);

  const range =
    max === min ? 1 : max - min;

  doc.setFontSize(7);
  doc.setTextColor(30, 40, 50);
  doc.text(title, x, y + 5);

  doc.setDrawColor(190, 190, 190);
  doc.rect(
    chartX,
    chartY,
    chartW,
    chartH
  );

  if (points.length < 2) return;

  points.forEach((point, index) => {
    const px =
      chartX +
      (index /
        (points.length - 1)) *
        chartW;

    const py =
      chartY +
      chartH -
      ((Number(point.value) - min) /
        range) *
        chartH;

    if (index > 0) {
      const previous = points[index - 1];

      const prevX =
        chartX +
        ((index - 1) /
          (points.length - 1)) *
          chartW;

      const prevY =
        chartY +
        chartH -
        ((Number(previous.value) - min) /
          range) *
          chartH;

      doc.line(
        prevX,
        prevY,
        px,
        py
      );
    }

    doc.circle(
      px,
      py,
      0.8,
      "F"
    );
  });

  doc.setFontSize(5.5);
  doc.setTextColor(100, 100, 100);

  doc.text(
    String(min),
    chartX,
    chartY + chartH + 5
  );

  doc.text(
    String(max),
    chartX + chartW - 8,
    chartY - 2
  );
}

function createTrendChartDataUrl(
  points,
  title
) {
  const width = 900;
  const height = 320;
  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  ctx.fillStyle = "#1F4E78";
  ctx.font = "bold 24px Arial";
  ctx.fillText(
    title,
    40,
    35
  );

  const values = points.map((p) =>
    Number(p.value)
  );

  const min =
    Math.min(...values);
  const max =
    Math.max(...values);

  const range =
    max === min ? 1 : max - min;

  const left = 60;
  const top = 55;
  const right = 30;
  const bottom = 45;

  const w =
    width - left - right;
  const h =
    height - top - bottom;

  ctx.strokeStyle = "#D9D9D9";
  ctx.lineWidth = 1;

  ctx.strokeRect(
    left,
    top,
    w,
    h
  );

  ctx.strokeStyle = "#1F4E78";
  ctx.lineWidth = 3;
  ctx.beginPath();

  points.forEach((point, index) => {
    const px =
      left +
      (index /
        Math.max(1, points.length - 1)) *
        w;

    const py =
      top +
      h -
      ((Number(point.value) - min) /
        range) *
        h;

    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });

  ctx.stroke();

  return canvas.toDataURL(
    "image/png"
  );
}

function flattenStudents(processedGroups) {
  const students = [];

  processedGroups.forEach((group) => {
    group.subgroupsList.forEach(
      (subgroup) => {
        subgroup.rankedStudents.forEach(
          (student) => {
            students.push({
              ...student,
              groupName:
                group.groupName,
              subgroupName:
                subgroup.name,
              activityNames:
                subgroup.activityNames,
              dateList:
                subgroup.dateList,
              dailyLogs:
                subgroup.dailyLogsMatrix.filter(
                  (row) =>
                    row.studentId ===
                    student.id
                )
            });
          }
        );
      }
    );
  });

  return students;
}

function uniqueActivities(students) {
  const set = new Set();

  students.forEach((student) => {
    (student.activityNames || []).forEach(
      (activity) => set.add(activity)
    );
  });

  return [...set];
}

function studentDates(student, analytics) {
  if (
    Array.isArray(student.dateList) &&
    student.dateList.length
  ) {
    return student.dateList;
  }

  return studentDatesFromStudent(student);
}

function studentDatesFromStudent(student) {
  const dates = new Set();

  Object.values(
    student.dailyActivityData || {}
  ).forEach((points) => {
    points.forEach((point) =>
      dates.add(point.date)
    );
  });

  Object.keys(
    student.marksByDate || {}
  ).forEach((date) =>
    dates.add(date)
  );

  return [...dates].sort();
}

function findActivityValue(
  student,
  activity,
  date
) {
  const points =
    student.dailyActivityData?.[activity] ||
    [];

  const point = points.find(
    (item) => item.date === date
  );

  return point
    ? point.value
    : null;
}

function findNumericActivityValue(
  student,
  activity,
  date
) {
  const value =
    findActivityValue(
      student,
      activity,
      date
    );

  if (value === null || value === undefined) {
    return null;
  }

  const numeric =
    Number(value);

  return Number.isFinite(numeric)
    ? numeric
    : null;
}

function priorityFor(student) {
  const reasons = [];

  if (student.avgMarks < 60) {
    reasons.push("Low average marks");
  }

  if (student.loggedDays === 0) {
    reasons.push("No Sadhna data");
  }

  if (
    hasHighVariability(student)
  ) {
    reasons.push(
      "Sadhna activity is inconsistent"
    );
  }

  if (reasons.some(
    (reason) =>
      reason === "No Sadhna data"
  )) {
    return {
      level: "red",
      reason: reasons.join("; ")
    };
  }

  if (student.avgMarks < 60) {
    return {
      level: "red",
      reason: reasons.join("; ")
    };
  }

  if (reasons.length) {
    return {
      level: "yellow",
      reason: reasons.join("; ")
    };
  }

  return {
    level: "green",
    reason: "Consistent"
  };
}

function mentorActionFor(priority) {
  if (priority.level === "red") {
    return "Mentor intervention required";
  }

  if (priority.level === "yellow") {
    return "Review with student";
  }

  return "Continue monitoring";
}

function hasHighVariability(student) {
  const series = [];

  Object.values(
    student.dailyActivityData || {}
  ).forEach((points) => {
    points.forEach((point) => {
      const value =
        Number(point.value);

      if (
        Number.isFinite(value)
      ) {
        series.push(value);
      }
    });
  });

  if (series.length < 4) {
    return false;
  }

  const mean =
    series.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / series.length;

  if (mean === 0) {
    return false;
  }

  const variance =
    series.reduce(
      (sum, value) =>
        sum +
        Math.pow(
          value - mean,
          2
        ),
      0
    ) / series.length;

  const standardDeviation =
    Math.sqrt(variance);

  const coefficientOfVariation =
    standardDeviation / Math.abs(mean);

  // Conservative export-only flag.
  // Change threshold after confirming business rules.
  return coefficientOfVariation >= 0.5;
}

function styleHeader(cell) {
  cell.font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: COLORS.black }
  };

  cell.fill =
    solidFill(COLORS.blue);

  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };

  addBorder(cell);
}

function styleBodyCell(cell) {
  cell.font = {
    name: "Calibri",
    size: 10,
    color: { argb: COLORS.black }
  };

  cell.alignment = {
    vertical: "center",
    wrapText: true
  };

  addBorder(cell);
}

function applyPriorityStyle(
  cell,
  level
) {
  if (level === "green") {
    cell.fill =
      solidFill(COLORS.green);

    cell.font = {
      bold: true,
      color: {
        argb: COLORS.greenText
      }
    };
  }

  if (level === "yellow") {
    cell.fill =
      solidFill(COLORS.yellow);

    cell.font = {
      bold: true,
      color: {
        argb: COLORS.yellowText
      }
    };
  }

  if (level === "red") {
    cell.fill =
      solidFill(COLORS.red);

    cell.font = {
      bold: true,
      color: {
        argb: COLORS.redText
      }
    };
  }

  addBorder(cell);
}

function addBorder(cell) {
  cell.border = {
    top: {
      style: "thin",
      color: { argb: COLORS.border }
    },
    left: {
      style: "thin",
      color: { argb: COLORS.border }
    },
    bottom: {
      style: "thin",
      color: { argb: COLORS.border }
    },
    right: {
      style: "thin",
      color: { argb: COLORS.border }
    }
  };
}

function solidFill(argb) {
  return {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb }
  };
}

function columnLetter(number) {
  let result = "";

  while (number > 0) {
    const remainder =
      (number - 1) % 26;

    result =
      String.fromCharCode(
        65 + remainder
      ) + result;

    number =
      Math.floor(
        (number - 1) / 26
      );
  }

  return result;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}

function hexToRgb(hex) {
  const clean =
    hex.replace("#", "");

  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16)
  ];
}

function ensureExtension(
  filename,
  extension
) {
  return filename
    .toLowerCase()
    .endsWith(extension)
    ? filename
    : filename.replace(
        /\.[^.]+$/,
        ""
      ) + extension;
}

function downloadBlob(blob, filename) {
  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}
