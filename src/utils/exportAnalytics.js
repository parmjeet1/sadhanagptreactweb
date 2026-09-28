// exportAnalytics.js
// Keep this function compatible with the existing API response.
// Rank remains subgroup-level. Average marks is normalized against the
// applicable daily maximum returned by the backend marking-scheme pipeline.

export const computeGroupExportAnalytics = (
  reportsData,
  explicitStartDate,
  explicitEndDate
) => {
  const groupsMap = {};
  let overallMinDate =
    explicitStartDate && explicitStartDate !== "2000-01-01"
      ? explicitStartDate
      : null;
  let overallMaxDate = explicitEndDate || null;

  reportsData.forEach((d) => {
    const groupName =
      d.center_name && d.center_name !== "N/A"
        ? d.center_name
        : "Unassigned Group";

    const subgroupName =
      d.label_name || d.label || "Uncategorized";

    const studentId = String(
      d.student_id || d.user_id || d.student_name || "unknown"
    );

    const studentName = d.student_name || "Student";
    const mobile = d.mobile || d.phone || "N/A";
    const actDate = d.activity_date || d.date || "-";
    const actName = d.activity_name || d.activity || "Activity";

    const actVal =
      d.activity_value !== undefined
        ? d.activity_value
        : d.count !== undefined
          ? d.count
          : "-";

    const rawMarks =
      d.activity_marks !== undefined
        ? d.activity_marks
        : null;

    const actMarks =
      rawMarks === null || rawMarks === undefined || rawMarks === ""
        ? null
        : Number(rawMarks);

    if (
      actDate !== "-" &&
      actDate !== "No Logged Activity"
    ) {
      if (!overallMinDate || actDate < overallMinDate)
        overallMinDate = actDate;

      if (!overallMaxDate || actDate > overallMaxDate)
        overallMaxDate = actDate;
    }

    if (!groupsMap[groupName]) {
      groupsMap[groupName] = {
        groupName,
        subgroupsMap: {},
        minDate:
          actDate !== "-" &&
          actDate !== "No Logged Activity"
            ? actDate
            : null,
        maxDate:
          actDate !== "-" &&
          actDate !== "No Logged Activity"
            ? actDate
            : null,
        rawLogs: []
      };
    }

    const g = groupsMap[groupName];

    if (
      actDate !== "-" &&
      actDate !== "No Logged Activity"
    ) {
      if (!g.minDate || actDate < g.minDate)
        g.minDate = actDate;

      if (!g.maxDate || actDate > g.maxDate)
        g.maxDate = actDate;
    }

    if (!g.subgroupsMap[subgroupName]) {
      g.subgroupsMap[subgroupName] = {
        name: subgroupName,
        studentsMap: {},
        datesSet: new Set(),
        activitySet: new Set()
      };
    }

    const sg = g.subgroupsMap[subgroupName];

    if (actName !== "No Logged Activity") {
      sg.activitySet.add(actName);

      if (actDate !== "-") {
        sg.datesSet.add(actDate);
      }
    }

    if (!sg.studentsMap[studentId]) {
      sg.studentsMap[studentId] = {
        id: studentId,
        name: studentName,
        mobile,
        groupName,
        subgroup: subgroupName,
        totalMarks: 0,
        totalMaxPossibleMarks: 0,
        maxMarksKeys: new Set(),
        markingSchemeId: d.marking_scheme_id ?? null,
        activityLogs: {},
        marksByDate: {},
        dailyMatrixByStudent: {},
        datesSet: new Set()
      };
    }

    const st = sg.studentsMap[studentId];

    // Maximum marks are accumulated once per reported activity/date.
    // This avoids applying today's activity set to historical/all-time data.
    const rowActivityMax = Number(d.activity_max_possible_marks);
    if (
      actDate !== "-" &&
      actName !== "No Logged Activity" &&
      Number.isFinite(rowActivityMax) &&
      rowActivityMax > 0
    ) {
      const maxKey = `${actDate}::${d.activity_id ?? actName}`;
      if (!st.maxMarksKeys.has(maxKey)) {
        st.maxMarksKeys.add(maxKey);
        st.totalMaxPossibleMarks += rowActivityMax;
      }
    }
    if (d.marking_scheme_id !== undefined && d.marking_scheme_id !== null) {
      st.markingSchemeId = d.marking_scheme_id;
    }

    if (
      actMarks !== null &&
      !Number.isNaN(actMarks)
    ) {
      st.totalMarks += actMarks;

      if (actDate !== "-") {
        st.marksByDate[actDate] =
          (st.marksByDate[actDate] || 0) + actMarks;
      }
    }

    if (actName !== "No Logged Activity") {
      if (actDate !== "-") {
        st.datesSet.add(actDate);
      }

      if (!st.activityLogs[actName]) {
        st.activityLogs[actName] = [];
      }

      st.activityLogs[actName].push(actVal);

      if (actDate !== "-") {
        if (!st.dailyMatrixByStudent[actDate]) {
          st.dailyMatrixByStudent[actDate] = {
            date: actDate,
            studentId: st.id,
            studentName,
            activities: {}
          };
        }

        st.dailyMatrixByStudent[actDate].activities[actName] =
          actVal;
      }
    }

    g.rawLogs.push({
      date: actDate,
      groupName,
      subgroup: subgroupName,
      studentId,
      studentName,
      mobile,
      activityName: actName,
      value: actVal,
      marks: actMarks
    });
  });

  const todayStr = new Date().toISOString().split("T")[0];

  const processedGroups = Object.values(groupsMap).map((g) => {
    const subgroupsList = Object.values(g.subgroupsMap).map((sg) => {
      const activityNames = Array.from(sg.activitySet);

      if (activityNames.length === 0) {
        activityNames.push("activity");
      }

      const dateList = Array.from(sg.datesSet).sort();

      const studentList = Object.values(
        sg.studentsMap
      ).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      const studentByStudentLogs = [];

      studentList.forEach((st) => {
        Object.values(st.dailyMatrixByStudent)
          .sort((a, b) =>
            a.date.localeCompare(b.date)
          )
          .forEach((row) => {
            studentByStudentLogs.push(row);
          });
      });

      const processedStudents = studentList.map((st) => {
        const activityAverages = {};
        const dailyActivityData = {};

        activityNames.forEach((actName) => {
          const vals = st.activityLogs[actName] || [];

          dailyActivityData[actName] = Object.values(
            st.dailyMatrixByStudent
          )
            .sort((a, b) =>
              a.date.localeCompare(b.date)
            )
            .filter(
              (row) =>
                row.activities[actName] !== undefined &&
                row.activities[actName] !== null &&
                row.activities[actName] !== "-"
            )
            .map((row) => ({
              date: row.date,
              value: row.activities[actName]
            }));

          if (vals.length === 0) {
            activityAverages[actName] = "-";
            return;
          }

          const timeVals = vals
            .map(timeStrToMins)
            .filter((v) => v !== null);

          if (
            timeVals.length > 0 &&
            timeVals.length === vals.length &&
            typeof vals[0] === "string" &&
            vals[0].includes(":")
          ) {
            const avgMins =
              timeVals.reduce((acc, curr) => acc + curr, 0) /
              timeVals.length;

            activityAverages[actName] =
              minsToClock(avgMins, /\b(?:AM|PM)\b/i.test(String(vals[0])));
            return;
          }

          const numVals = vals
            .map((v) => Number(v))
            .filter((v) => !Number.isNaN(v));

          if (numVals.length > 0) {
            const avgNum =
              numVals.reduce((acc, curr) => acc + curr, 0) /
              numVals.length;

            activityAverages[actName] =
              parseFloat(avgNum.toFixed(1));
          } else {
            activityAverages[actName] =
              vals[0] || "-";
          }
        });

        const loggedDays = st.datesSet.size;
        const totalDaysCount =
          dateList.length > 0
            ? dateList.length
            : loggedDays > 0
              ? loggedDays
              : 1;

        const totalMaxPossibleMarks = st.totalMaxPossibleMarks;

        const avgMarksNum =
          totalMaxPossibleMarks > 0
            ? (st.totalMarks / totalMaxPossibleMarks) * 100
            : 0;

        return {
          id: st.id,
          name: st.name,
          mobile: st.mobile,
          groupName: st.groupName,
          subgroup: st.subgroup,
          activityAverages,
          dailyActivityData,
          totalMarks: st.totalMarks,
          totalMaxPossibleMarks,
          markingSchemeId: st.markingSchemeId,
          marksByDate: st.marksByDate,
          loggedDays,
          avgMarks: Number(avgMarksNum.toFixed(2)),
          avgMarksFormatted:
            `${avgMarksNum.toFixed(2)}%`
        };
      });

      const rankedStudents = [...processedStudents]
        .sort(
          (a, b) =>
            b.avgMarks - a.avgMarks ||
            b.totalMarks - a.totalMarks ||
            a.name.localeCompare(b.name)
        )
        .map((st, idx) => ({
          ...st,
          rank: idx + 1
        }));

      return {
        name: sg.name,
        activityNames,
        dateList,
        dailyLogsMatrix: studentByStudentLogs,
        processedStudents,
        rankedStudents
      };
    });

    const minD =
      explicitStartDate &&
      explicitStartDate !== "2000-01-01"
        ? explicitStartDate
        : g.minDate ||
          overallMinDate ||
          (explicitStartDate === "2000-01-01"
            ? "2000-01-01"
            : todayStr);

    const maxD =
      explicitEndDate ||
      g.maxDate ||
      overallMaxDate ||
      todayStr;

    return {
      groupName: g.groupName,
      minDate: minD,
      maxDate: maxD,
      subgroupsList,
      rawLogs: g.rawLogs
    };
  });

  const finalMin =
    explicitStartDate &&
    explicitStartDate !== "2000-01-01"
      ? explicitStartDate
      : overallMinDate ||
        (explicitStartDate === "2000-01-01"
          ? "2000-01-01"
          : todayStr);

  const finalMax =
    explicitEndDate ||
    overallMaxDate ||
    todayStr;

  return {
    processedGroups,
    overallMinDate: finalMin,
    overallMaxDate: finalMax
  };
};

function timeStrToMins(value) {
  if (typeof value !== "string") return null;

  const str = value.trim().toUpperCase();
  const match = str.match(/^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?\s*(AM|PM)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);
  const meridiem = match[4];

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes + seconds / 60;
}

function minsToClock(totalMinutes, useMeridiem = false) {
  const rounded = Math.round(totalMinutes);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;

  if (useMeridiem) {
    const normalizedHours = ((hours % 24) + 24) % 24;
    const suffix = normalizedHours < 12 ? "AM" : "PM";
    const displayHours = normalizedHours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
