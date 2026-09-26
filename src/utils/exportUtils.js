export { exportBulkReportsToExcel, exportBulkReportsToPDF } from './studentReportExport';
export { computeGroupExportAnalytics } from './exportAnalytics';

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


