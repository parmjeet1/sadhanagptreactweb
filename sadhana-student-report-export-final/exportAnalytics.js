// exportAnalytics.js
// Keep this function compatible with the existing API response.
// Rank remains subgroup-level and average marks keeps the existing business rule:
// total marks / all dates in the selected subgroup/date range.

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
        activityLogs: {},
        marksByDate: {},
        dailyMatrixByStudent: {},
        datesSet: new Set()
      };
    }

    const st = sg.studentsMap[studentId];

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
              minsToHHMM(avgMins);
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

        const avgMarksNum =
          st.totalMarks / totalDaysCount;

        return {
          id: st.id,
          name: st.name,
          mobile: st.mobile,
          groupName: st.groupName,
          subgroup: st.subgroup,
          activityAverages,
          dailyActivityData,
          totalMarks: st.totalMarks,
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

  const match = value.trim().match(
    /^(\d{1,3}):([0-5]\d)(?::([0-5]\d))?$/
  );

  if (!match) return null;

  return (
    Number(match[1]) * 60 +
    Number(match[2]) +
    Number(match[3] || 0) / 60
  );
}

function minsToHHMM(totalMinutes) {
  const rounded = Math.round(totalMinutes);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;
}
