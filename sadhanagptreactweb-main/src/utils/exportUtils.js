export const exportAnalyticsToCSV = (activitiesData, activeTab) => {
  if (!activitiesData || activitiesData.length === 0) return;

  const headers = ['Activity', 'Average / Total', 'Label', 'Trend'];
  const rows = activitiesData.map(act => {
    const name = `"${(act.name || '').replace(/"/g, '""')}"`;
    const value = `"${String(act.value || 0).replace(/"/g, '""')}"`;
    const label = `"${(act.label || '').replace(/"/g, '""')}"`;
    const trend = `"${(act.trend || '').replace(/"/g, '""')}"`;
    return [name, value, label, trend].join(',');
  });
  
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `analytics_export_${formatPeriod(activeTab)}.csv`);
};

export const exportAnalyticsToExcel = (activitiesData, activeTab) => {
  if (!activitiesData || activitiesData.length === 0) return;

  let table = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
  table += '<head><meta charset="UTF-8"></head><body>';
  table += '<table border="1"><tr>';
  table += '<th>Activity</th><th>Average / Total</th><th>Label</th><th>Trend</th></tr>';
  
  activitiesData.forEach(act => {
    table += `<tr>
      <td>${escapeHTML(act.name)}</td>
      <td>${escapeHTML(String(act.value || 0))}</td>
      <td>${escapeHTML(act.label)}</td>
      <td>${escapeHTML(act.trend)}</td>
    </tr>`;
  });
  
  table += '</table></body></html>';
  
  const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
  triggerDownload(blob, `analytics_export_${formatPeriod(activeTab)}.xls`);
};

export const printAnalyticsToPDF = (activitiesData, activeTab, userName = 'Student') => {
  if (!activitiesData || activitiesData.length === 0) return;

  const dateStr = new Date().toLocaleDateString();
  const periodText = activeTab === '7 Days' ? 'Last 7 Days' : (activeTab === '30 Days' ? 'Last 30 Days' : 'Custom Range');

  let html = `
    <html>
      <head>
        <title>Analytics Report</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #1e293b; }
          h1 { color: #0f172a; margin-bottom: 5px; }
          .meta { color: #64748b; margin-bottom: 30px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background-color: #f8fafc; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 12px; }
          .trend-stable { color: #1a73e8; font-weight: bold; }
          .trend-improved { color: #16a34a; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Sadhana Analytics Report</h1>
        <div class="meta">
          <strong>Period:</strong> ${periodText}<br>
          <strong>Generated:</strong> ${dateStr}
        </div>
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Average / Total</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
  `;

  activitiesData.forEach(act => {
    const trendClass = act.trend === 'Stable' ? 'trend-stable' : 'trend-improved';
    html += `
      <tr>
        <td style="font-weight: bold;">${escapeHTML(act.name)}</td>
        <td>
           <span style="font-size: 18px; font-weight: bold;">${escapeHTML(String(act.value || 0))}</span> 
           <span style="color: #64748b; font-size: 14px;">${escapeHTML(act.label)}</span>
        </td>
        <td class="${trendClass}">${escapeHTML(act.trend)}</td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
};

// --- Advanced Group Analytics Processor for Multi-Tab, Looping Subgroups & Side-by-Side Excel Export ---

const formatDateDDMMM = (dateStr) => {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const cleanDateStr = String(dateStr).split('T')[0];
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}/${d.getFullYear()}`;
    }
  } catch (e) {}
  return String(dateStr);
};

const timeStrToMins = (valStr) => {
  if (valStr === null || valStr === undefined || valStr === '-') return null;
  if (typeof valStr === 'number') return valStr;
  const str = String(valStr).trim().toUpperCase();
  if (!str.includes(':')) {
    const n = Number(str);
    return isNaN(n) ? null : n;
  }
  try {
    const isPM = str.includes('PM');
    const isAM = str.includes('AM');
    const clean = str.replace('AM', '').replace('PM', '').trim();
    const parts = clean.split(':').map(Number);
    let h = parts[0] || 0;
    const m = parts[1] || 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  } catch (e) {
    return null;
  }
};

const minsToHHMM = (totalMins) => {
  if (totalMins === null || totalMins === undefined || isNaN(totalMins)) return '-';
  let hrs = Math.floor(totalMins / 60) % 24;
  let mins = Math.round(totalMins % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const computeGroupExportAnalytics = (reportsData, explicitStartDate, explicitEndDate) => {
  const groupsMap = {};
  let overallMinDate = (explicitStartDate && explicitStartDate !== '2000-01-01') ? explicitStartDate : null;
  let overallMaxDate = explicitEndDate || null;

  reportsData.forEach(d => {
    const groupName = d.center_name && d.center_name !== 'N/A' ? d.center_name : 'Unassigned Group';
    const subgroupName = d.label_name || d.label || 'Uncategorized';
    const studentId = String(d.student_id || d.user_id || d.student_name || 'unknown');
    const studentName = d.student_name || 'Student';
    const mobile = d.mobile || d.phone || 'N/A';
    const actDate = d.activity_date || d.date || '-';
    const actName = d.activity_name || d.activity || 'Activity';
    const actVal = d.activity_value !== undefined ? d.activity_value : (d.count !== undefined ? d.count : '-');
    const actMarks = d.activity_marks !== undefined ? d.activity_marks : 0;

    if (actDate !== '-' && actDate !== 'No Logged Activity') {
      if (!overallMinDate || actDate < overallMinDate) overallMinDate = actDate;
      if (!overallMaxDate || actDate > overallMaxDate) overallMaxDate = actDate;
    }

    if (!groupsMap[groupName]) {
      groupsMap[groupName] = {
        groupName,
        subgroupsMap: {},
        minDate: (actDate !== '-' && actDate !== 'No Logged Activity') ? actDate : null,
        maxDate: (actDate !== '-' && actDate !== 'No Logged Activity') ? actDate : null,
        rawLogs: []
      };
    }
    const g = groupsMap[groupName];
    if (actDate !== '-' && actDate !== 'No Logged Activity') {
      if (!g.minDate || actDate < g.minDate) g.minDate = actDate;
      if (!g.maxDate || actDate > g.maxDate) g.maxDate = actDate;
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

    if (actName !== 'No Logged Activity') {
      sg.activitySet.add(actName);
      if (actDate !== '-') sg.datesSet.add(actDate);
    }

    if (!sg.studentsMap[studentId]) {
      sg.studentsMap[studentId] = {
        id: studentId,
        name: studentName,
        mobile: mobile,
        groupName: groupName,
        subgroup: subgroupName,
        totalMarks: 0,
        activityLogs: {},
        marksByDate: {},
        dailyMatrixByStudent: {},
        datesSet: new Set()
      };
    }
    const st = sg.studentsMap[studentId];

    if (actMarks !== '-' && actMarks !== null && actMarks !== undefined && !isNaN(Number(actMarks))) {
      const numMarks = Number(actMarks);
      st.totalMarks += numMarks;
      if (actDate !== '-') {
        st.marksByDate[actDate] = (st.marksByDate[actDate] || 0) + numMarks;
      }
    }

    if (actName !== 'No Logged Activity') {
      if (actDate !== '-') st.datesSet.add(actDate);
      if (!st.activityLogs[actName]) st.activityLogs[actName] = [];
      st.activityLogs[actName].push(actVal);

      if (actDate !== '-') {
        if (!st.dailyMatrixByStudent[actDate]) {
          st.dailyMatrixByStudent[actDate] = {
            date: actDate,
            studentName: studentName,
            activities: {}
          };
        }
        st.dailyMatrixByStudent[actDate].activities[actName] = actVal;
      }
    }

    g.rawLogs.push({
      date: actDate,
      groupName: groupName,
      subgroup: subgroupName,
      studentName: studentName,
      mobile: mobile,
      activityName: actName,
      value: actVal,
      marks: actMarks
    });
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const processedGroups = Object.values(groupsMap).map(g => {
    const subgroupsList = Object.values(g.subgroupsMap).map(sg => {
      const activityNames = Array.from(sg.activitySet);
      if (activityNames.length === 0) activityNames.push('activity');

      const dateList = Array.from(sg.datesSet).sort();

      // Sort student list alphabetically by student name
      const studentList = Object.values(sg.studentsMap).sort((a, b) => a.name.localeCompare(b.name));

      // Build dailyLogsMatrix: Student by Student! (All dates of Student 1 first, then Student 2, etc.)
      const studentByStudentLogs = [];
      studentList.forEach(st => {
        const studentDates = Object.values(st.dailyMatrixByStudent).sort((a, b) => a.date.localeCompare(b.date));
        studentDates.forEach(dRow => {
          studentByStudentLogs.push(dRow);
        });
      });

      // Build processed student objects
      const processedStudents = studentList.map((st) => {
        const activityAverages = {};
        let totalCount = 0;

        activityNames.forEach(actName => {
          const vals = st.activityLogs[actName] || [];
          if (vals.length === 0) {
            activityAverages[actName] = '-';
          } else {
            totalCount += vals.length;
            const timeVals = vals.map(timeStrToMins).filter(v => v !== null);
            if (timeVals.length > 0 && timeVals.length === vals.length && typeof vals[0] === 'string' && vals[0].includes(':')) {
              const avgMins = timeVals.reduce((acc, curr) => acc + curr, 0) / timeVals.length;
              activityAverages[actName] = minsToHHMM(avgMins);
            } else {
              const numVals = vals.map(v => Number(v)).filter(v => !isNaN(v));
              if (numVals.length > 0) {
                const avgNum = numVals.reduce((acc, curr) => acc + curr, 0) / numVals.length;
                activityAverages[actName] = parseFloat(avgNum.toFixed(1));
              } else {
                activityAverages[actName] = vals[0] || '-';
              }
            }
          }
        });

        const loggedDays = st.datesSet.size;
        const totalDaysCount = dateList.length > 0 ? dateList.length : (loggedDays > 0 ? loggedDays : 1);
        const avgMarksNum = st.totalMarks / totalDaysCount;

        return {
          id: st.id,
          name: st.name,
          mobile: st.mobile,
          subgroup: st.subgroup,
          activityAverages,
          totalMarks: st.totalMarks,
          marksByDate: st.marksByDate,
          loggedDays: loggedDays,
          avgMarks: parseFloat(avgMarksNum.toFixed(2)),
          avgMarksFormatted: `${avgMarksNum.toFixed(2)}%`
        };
      });

      const rankedStudents = [...processedStudents].sort((a, b) => b.avgMarks - a.avgMarks || b.totalMarks - a.totalMarks).map((st, idx) => ({ ...st, rank: idx + 1 }));

      return {
        name: sg.name,
        activityNames,
        dateList,
        dailyLogsMatrix: studentByStudentLogs,
        processedStudents,
        rankedStudents
      };
    });

    let minD = (explicitStartDate && explicitStartDate !== '2000-01-01') 
      ? explicitStartDate 
      : (g.minDate || overallMinDate || (explicitStartDate === '2000-01-01' ? '2000-01-01' : todayStr));

    let maxD = explicitEndDate || g.maxDate || overallMaxDate || todayStr;

    return {
      groupName: g.groupName,
      minDate: minD,
      maxDate: maxD,
      subgroupsList,
      rawLogs: g.rawLogs
    };
  });

  const finalMin = (explicitStartDate && explicitStartDate !== '2000-01-01') 
    ? explicitStartDate 
    : (overallMinDate || (explicitStartDate === '2000-01-01' ? '2000-01-01' : todayStr));

  const finalMax = explicitEndDate || overallMaxDate || todayStr;

  return {
    processedGroups,
    overallMinDate: finalMin,
    overallMaxDate: finalMax
  };
};

export const exportBulkReportsToCSV = (reportsData, filename, explicitStartDate, explicitEndDate) => {
  if (!reportsData || reportsData.length === 0) return;

  const { processedGroups, overallMinDate, overallMaxDate } = computeGroupExportAnalytics(reportsData, explicitStartDate, explicitEndDate);

  let csvLines = [];
  csvLines.push(`"SADHANA PERFORMANCE REPORT"`);
  csvLines.push(`"Date From","${formatDateDDMMM(overallMinDate)}"`);
  csvLines.push(`"Date To","${formatDateDDMMM(overallMaxDate)}"`);
  csvLines.push('');

  processedGroups.forEach(g => {
    csvLines.push(`"GROUP: ${g.groupName.toUpperCase()}"`);
    g.subgroupsList.forEach(sg => {
      csvLines.push(`"SUBGROUP: ${sg.name.toUpperCase()}"`);
      csvLines.push(`"DAILY LOGS"`);
      csvLines.push(`"date","students name",${sg.activityNames.map(a => `"${a.toLowerCase()}"`).join(',')}`);
      sg.dailyLogsMatrix.forEach(row => {
        const actVals = sg.activityNames.map(a => `"${row.activities[a] ?? '-'}"`).join(',');
        csvLines.push(`"${formatDateDDMMM(row.date)}","${row.studentName}",${actVals}`);
      });
      csvLines.push('');
      csvLines.push(`"STUDENT AVERAGES & RANKINGS"`);
      csvLines.push(`"students name",${sg.activityNames.map(a => `"avg ${a.toLowerCase()}"`).join(',')},"avg marks","rank"`);
      sg.rankedStudents.forEach(st => {
        const avgVals = sg.activityNames.map(a => `"${st.activityAverages[a] ?? '-'}"`).join(',');
        csvLines.push(`"${st.name}",${avgVals},"${st.avgMarks}","${st.rank}"`);
      });
      csvLines.push('');
    });
  });

  const csvContent = csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
};

export const exportBulkReportsToExcel = (reportsData, filename, explicitStartDate, explicitEndDate) => {
  if (!reportsData || reportsData.length === 0) return;

  const { processedGroups, overallMinDate, overallMaxDate } = computeGroupExportAnalytics(reportsData, explicitStartDate, explicitEndDate);

  let xml = `<?xml version="1.0"?>\n`;
  xml += `<?mso-application progid="Excel.Sheet"?>\n`;
  xml += `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n`;
  xml += ` xmlns:o="urn:schemas-microsoft-com:office:office"\n`;
  xml += ` xmlns:x="urn:schemas-microsoft-com:office:excel"\n`;
  xml += ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n`;
  xml += ` xmlns:html="http://www.w3.org/TR/REC-html40">\n`;

  xml += `<Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Bottom"/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
    </Style>
    <Style ss:ID="DateBoxHeader">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#1F4E78"/>
      <Interior ss:Color="#D9E1F2" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#8EA9DB"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#8EA9DB"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#8EA9DB"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#8EA9DB"/>
      </Borders>
    </Style>
    <Style ss:ID="DateBoxValue">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#000000"/>
      <Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
      </Borders>
    </Style>
    <Style ss:ID="SubgroupBanner">
      <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#274E13"/>
      <Interior ss:Color="#D9EAD3" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C47D"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C47D"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C47D"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C47D"/>
      </Borders>
    </Style>
    <Style ss:ID="BlueHeader">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#000000"/>
      <Interior ss:Color="#C6D9F8" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#8EA9DB"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#8EA9DB"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#8EA9DB"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#8EA9DB"/>
      </Borders>
    </Style>
    <Style ss:ID="TableCell">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
      </Borders>
    </Style>
    <Style ss:ID="TableCellNum">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#000000"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
      </Borders>
    </Style>
    <Style ss:ID="TableCellCenter">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9D9D9"/>
      </Borders>
    </Style>
    <Style ss:ID="MarksHigh">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#274E13"/>
      <Interior ss:Color="#D9EAD3" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C47D"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C47D"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C47D"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93C47D"/>
      </Borders>
    </Style>
    <Style ss:ID="MarksMed">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#B45F06"/>
      <Interior ss:Color="#FFF2CC" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1C232"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1C232"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1C232"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1C232"/>
      </Borders>
    </Style>
    <Style ss:ID="MarksLow">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#CC0000"/>
      <Interior ss:Color="#FCE5CD" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E6B8AF"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E6B8AF"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E6B8AF"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E6B8AF"/>
      </Borders>
    </Style>
  </Styles>\n`;

  const makeSheetName = (groupName, suffix) => {
    let cleanGroup = String(groupName || 'Group').replace(/[\\/?*:[\]]/g, '').trim();
    const maxGroupLen = 31 - (suffix.length + 1);
    if (cleanGroup.length > maxGroupLen) {
      cleanGroup = cleanGroup.substring(0, maxGroupLen);
    }
    return `${cleanGroup}-${suffix}`;
  };

  processedGroups.forEach(g => {
    const sheet1Name = makeSheetName(g.groupName, 'logged-data');
    const sheet2Name = makeSheetName(g.groupName, 'marks');

    // --- TAB 1: [group_name]-logged-data ---
    xml += `<Worksheet ss:Name="${escapeXML(sheet1Name)}">\n`;
    xml += `<Table>\n`;
    xml += `<Column ss:Width="100"/><Column ss:Width="160"/><Column ss:Width="90"/><Column ss:Width="90"/><Column ss:Width="90"/><Column ss:Width="90"/><Column ss:Width="90"/>\n`;

    // Row 1: date form | date to
    xml += `<Row ss:Height="22">
      <Cell ss:StyleID="DateBoxHeader"><Data ss:Type="String">date form</Data></Cell>
      <Cell ss:StyleID="DateBoxHeader"><Data ss:Type="String">date to</Data></Cell>
    </Row>\n`;

    // Row 2: dates
    xml += `<Row ss:Height="22">
      <Cell ss:StyleID="DateBoxValue"><Data ss:Type="String">${formatDateDDMMM(g.minDate)}</Data></Cell>
      <Cell ss:StyleID="DateBoxValue"><Data ss:Type="String">${formatDateDDMMM(g.maxDate)}</Data></Cell>
    </Row>\n`;

    xml += `<Row></Row>\n`;

    g.subgroupsList.forEach(sg => {
      // Green Subgroup Banner Row
      xml += `<Row ss:Height="24">
        <Cell ss:StyleID="SubgroupBanner"><Data ss:Type="String">${escapeXML(sg.name.toLowerCase())}</Data></Cell>
      </Row>\n`;

      // Header Row
      xml += `<Row ss:Height="22">\n`;
      xml += `<Cell ss:StyleID="BlueHeader"><Data ss:Type="String">date</Data></Cell>\n`;
      xml += `<Cell ss:StyleID="BlueHeader"><Data ss:Type="String">students name</Data></Cell>\n`;
      sg.activityNames.forEach(actName => {
        xml += `<Cell ss:StyleID="BlueHeader"><Data ss:Type="String">${escapeXML(actName.toLowerCase())}</Data></Cell>\n`;
      });
      xml += `</Row>\n`;

      // Data Rows — Grouped Student-by-Student!
      if (sg.dailyLogsMatrix.length > 0) {
        sg.dailyLogsMatrix.forEach(row => {
          xml += `<Row ss:Height="20">\n`;
          xml += `<Cell ss:StyleID="TableCellCenter"><Data ss:Type="String">${formatDateDDMMM(row.date)}</Data></Cell>\n`;
          xml += `<Cell ss:StyleID="TableCell"><Data ss:Type="String">${escapeXML(row.studentName)}</Data></Cell>\n`;
          sg.activityNames.forEach(actName => {
            const val = row.activities[actName];
            if (val === undefined || val === null || val === '-') {
              xml += `<Cell ss:StyleID="TableCellCenter"><Data ss:Type="String">-</Data></Cell>\n`;
            } else if (typeof val === 'number') {
              xml += `<Cell ss:StyleID="TableCellCenter"><Data ss:Type="Number">${val}</Data></Cell>\n`;
            } else {
              xml += `<Cell ss:StyleID="TableCellCenter"><Data ss:Type="String">${escapeXML(String(val))}</Data></Cell>\n`;
            }
          });
          xml += `</Row>\n`;
        });
      } else {
        xml += `<Row ss:Height="20">
          <Cell ss:StyleID="TableCellCenter"><Data ss:Type="String">-</Data></Cell>
          <Cell ss:StyleID="TableCell"><Data ss:Type="String">No logged activity in this period</Data></Cell>
        </Row>\n`;
      }

      xml += `<Row></Row>\n`;
    });

    xml += `</Table>\n</Worksheet>\n`;

    // --- TAB 2: [group_name]-marks ---
    xml += `<Worksheet ss:Name="${escapeXML(sheet2Name)}">\n`;
    xml += `<Table>\n`;
    xml += `<Column ss:Width="160"/><Column ss:Width="90"/><Column ss:Width="90"/><Column ss:Width="90"/><Column ss:Width="90"/><Column ss:Width="90"/><Column ss:Width="110"/>\n`;

    g.subgroupsList.forEach(sg => {
      // Subgroup Banner Row
      xml += `<Row ss:Height="24">
        <Cell ss:StyleID="SubgroupBanner"><Data ss:Type="String">${escapeXML(sg.name.toLowerCase())}</Data></Cell>
      </Row>\n`;

      // Header Row: Student Name | dates... | Average Marks
      xml += `<Row ss:Height="22">\n`;
      xml += `<Cell ss:StyleID="BlueHeader"><Data ss:Type="String">Student Name</Data></Cell>\n`;
      sg.dateList.forEach(d => {
        xml += `<Cell ss:StyleID="BlueHeader"><Data ss:Type="String">${formatDateDDMMM(d)}</Data></Cell>\n`;
      });
      xml += `<Cell ss:StyleID="BlueHeader"><Data ss:Type="String">Average Marks</Data></Cell>\n`;
      xml += `</Row>\n`;

      // Data Rows: Each student in subgroup
      if (sg.processedStudents.length > 0) {
        sg.processedStudents.forEach(st => {
          xml += `<Row ss:Height="20">\n`;
          xml += `<Cell ss:StyleID="TableCell"><Data ss:Type="String">${escapeXML(st.name)}</Data></Cell>\n`;

          sg.dateList.forEach(d => {
            const m = st.marksByDate[d];
            if (m === undefined || m === null) {
              xml += `<Cell ss:StyleID="TableCellCenter"><Data ss:Type="String">-</Data></Cell>\n`;
            } else {
              const numM = Number(m);
              let styleId = 'MarksMed';
              if (numM >= 75) styleId = 'MarksHigh';
              else if (numM >= 50) styleId = 'MarksMed';
              else styleId = 'MarksLow';

              xml += `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${numM}</Data></Cell>\n`;
            }
          });

          xml += `<Cell ss:StyleID="TableCellNum"><Data ss:Type="String">${st.avgMarksFormatted}</Data></Cell>\n`;
          xml += `</Row>\n`;
        });
      } else {
        xml += `<Row ss:Height="20">
          <Cell ss:StyleID="TableCell"><Data ss:Type="String">No students</Data></Cell>
        </Row>\n`;
      }

      xml += `<Row></Row>\n`;
    });

    xml += `</Table>\n</Worksheet>\n`;
  });

  xml += `</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  triggerDownload(blob, filename);
};

export const exportBulkReportsToPDF = (reportsData, durationLabel, filename) => {
  if (!reportsData || reportsData.length === 0) return;

  const { processedGroups, overallMinDate, overallMaxDate } = computeGroupExportAnalytics(reportsData);

  let html = `
    <html>
      <head>
        <title>Sadhana Performance Report</title>
        <style>
          body { font-family: sans-serif; padding: 25px; color: #1e293b; }
          h1 { color: #0f172a; margin-bottom: 5px; font-size: 20px; }
          .meta { color: #64748b; margin-bottom: 20px; font-size: 13px; }
          .subgroup-header { background: #d9ead3; color: #274e13; padding: 6px 10px; font-size: 13px; font-weight: bold; border-radius: 4px; margin-top: 15px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
          th, td { padding: 6px 8px; text-align: left; border: 1px solid #e2e8f0; }
          th { background-color: #c6d9f8; font-weight: bold; color: #000000; }
        </style>
      </head>
      <body>
        <h1>Sadhana &amp; Performance Report</h1>
        <div class="meta">
          <strong>Date Range:</strong> ${formatDateDDMMM(overallMinDate)} to ${formatDateDDMMM(overallMaxDate)}
        </div>
  `;

  processedGroups.forEach(g => {
    html += `<h2>Group: ${escapeHTML(g.groupName)}</h2>`;
    g.subgroupsList.forEach(sg => {
      html += `
        <div class="subgroup-header">Subgroup: ${escapeHTML(sg.name)}</div>
        <div style="display:flex; gap:20px;">
          <div style="flex:1;">
            <strong>Daily Logs Matrix</strong>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student Name</th>
                  ${sg.activityNames.map(a => `<th>${escapeHTML(a)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
      `;

      sg.dailyLogsMatrix.forEach(row => {
        html += `
          <tr>
            <td>${formatDateDDMMM(row.date)}</td>
            <td>${escapeHTML(row.studentName)}</td>
            ${sg.activityNames.map(a => `<td>${escapeHTML(String(row.activities[a] ?? '-'))}</td>`).join('')}
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
          <div style="flex:1;">
            <strong>Averages &amp; Rankings</strong>
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  ${sg.activityNames.map(a => `<th>Avg ${escapeHTML(a)}</th>`).join('')}
                  <th>Avg Marks</th>
                  <th>Rank</th>
                </tr>
              </thead>
              <tbody>
      `;

      sg.rankedStudents.forEach(st => {
        html += `
          <tr>
            <td>${escapeHTML(st.name)}</td>
            ${sg.activityNames.map(a => `<td>${escapeHTML(String(st.activityAverages[a] ?? '-'))}</td>`).join('')}
            <td>${st.avgMarks}</td>
            <td>#${st.rank}</td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    });
  });

  html += `
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
};

// Utilities
const formatPeriod = (activeTab) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const period = activeTab.replace(/\s+/g, '_').toLowerCase();
  return `${period}_${dateStr}`;
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const escapeHTML = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const escapeXML = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const sanitizeSheetName = (name) => {
  if (!name) return 'Sheet';
  let clean = String(name).replace(/[\\/?*:[\]]/g, '').trim();
  if (clean.length > 30) clean = clean.substring(0, 30);
  return clean || 'Sheet';
};


