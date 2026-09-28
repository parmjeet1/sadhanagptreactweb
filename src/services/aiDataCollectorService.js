import { postRequest, getRequest } from './api';
import { openChatGPTWithPrompt, buildSadhanaPrompt, getDateRangeForPreset } from '../utils/chatGptUtils';

/**
 * Centralized service to execute dynamic API strategy, format prompt, copy to clipboard,
 * and redirect safely to ChatGPT without triggering pop-up blockers.
 */
export const collectAndRedirectToChatGPT = async ({
  strategy = 'BULK_MENTEES',
  preset = 'LAST_7_DAYS',
  customFrom = '',
  customTo = '',
  entityParams = {},
  newWindowHandle = null,
  onStatusUpdate = null
}) => {
  const { startDate, endDate, apiFilter } = getDateRangeForPreset(preset, customFrom, customTo);

  const notify = (msg) => {
    if (typeof onStatusUpdate === 'function') onStatusUpdate(msg);
  };

  notify(`Collecting data for ${startDate} to ${endDate}...`);

  let dataText = '';
  let studentCount = entityParams.studentIds ? entityParams.studentIds.length : null;

  try {
    if (strategy === 'BULK_MENTEES') {
      const payload = {
        filter: apiFilter,
        start_date: startDate,
        end_date: endDate,
        student_ids: entityParams.studentIds || []
      };

      const res = await postRequest('/export-bulk-student-reports', payload);
      const dataRows = res?.data?.data || [];

      if (Array.isArray(dataRows) && dataRows.length > 0) {
        const grouped = {};
        dataRows.forEach(row => {
          const name = row.student_name || 'Student';
          if (!grouped[name]) {
            grouped[name] = {
              mobile: row.mobile || 'N/A',
              center: row.center_name || 'N/A',
              label: row.label_name || 'Uncategorized',
              activities: []
            };
          }
          if (row.activity_name) {
            grouped[name].activities.push(
              `  - Date: ${row.activity_date || ''} | Activity: ${row.activity_name} | Value: ${row.activity_value ?? ''} | Marks: ${row.activity_marks ?? ''}`
            );
          }
        });

        dataText = Object.entries(grouped).map(([name, info], idx) => {
          const acts = info.activities.length > 0 ? info.activities.join('\n') : '  - No activity logs recorded';
          return `Student #${idx + 1}: ${name} (Mobile: ${info.mobile}, Group: ${info.center}, Sub-Group: ${info.label})\nActivities Logged:\n${acts}`;
        }).join('\n\n');
      } else if (entityParams.fallbackStudents && entityParams.fallbackStudents.length > 0) {
        dataText = entityParams.fallbackStudents.map((s, idx) => {
          const acts = Array.isArray(s.activities) && s.activities.length > 0
            ? s.activities.map(a => `  - ${a.name || a.activity_name}: ${a.value ?? a.count ?? 0} (Marks: ${a.marks ?? 0})`).join('\n')
            : '  - No detailed activity breakdown available';
          return `Student #${idx + 1}: ${s.name || 'N/A'} (Group: ${s.group || 'N/A'})\n${acts}`;
        }).join('\n\n');
      }
    } else if (strategy === 'SINGLE_STUDENT') {
      const res = await getRequest('/student-details', {
        user_id: entityParams.userId,
        student_id: entityParams.studentId,
        start_date: startDate,
        end_date: endDate,
        filter: apiFilter
      });

      const resData = res?.data?.data || res?.data || [];
      const activities = Array.isArray(resData) 
        ? resData 
        : (resData.activities_analytics || resData.data || []);

      if (Array.isArray(activities) && activities.length > 0) {
        dataText = `Mentee Name: ${entityParams.studentName || 'Mentee'}\nActivity Performance Logs (${startDate} to ${endDate}):\n` + 
          activities.map(act => {
            const name = act.activity_name || act.name || 'Activity';
            const val = act.value ?? act.count ?? act.total_value ?? 0;
            const marks = act.marks ?? act.total_marks ?? 0;
            const date = act.date || act.activity_date || '';
            return `- ${date ? `[${date}] ` : ''}${name}: ${val} (Marks: ${marks})`;
          }).join('\n');
      } else {
        dataText = `Mentee Name: ${entityParams.studentName || 'Mentee'}\nNo activity logs recorded between ${startDate} and ${endDate}.`;
      }
    } else if (strategy === 'PERSONAL_SADHANA') {
      const res = await getRequest('/student-activities-analytics', {
        user_id: entityParams.userId,
        start_date: startDate,
        end_date: endDate,
        filter: apiFilter
      });

      const resData = res?.data?.data || res?.data || [];
      const activities = Array.isArray(resData) 
        ? resData 
        : (resData.activities_analytics || resData.data || []);

      if (Array.isArray(activities) && activities.length > 0) {
        dataText = `Counsellor Name: ${entityParams.counsellorName || 'Counsellor'}\nPersonal Sadhana Logs (${startDate} to ${endDate}):\n` + 
          activities.map(act => {
            const name = act.activity_name || act.name || 'Activity';
            const val = act.value ?? act.count ?? act.total_value ?? 0;
            const marks = act.marks ?? act.total_marks ?? 0;
            const date = act.date || act.activity_date || '';
            return `- ${date ? `[${date}] ` : ''}${name}: ${val} (Marks: ${marks})`;
          }).join('\n');
      } else {
        dataText = `Counsellor Name: ${entityParams.counsellorName || 'Counsellor'}\nNo personal activity logs recorded between ${startDate} and ${endDate}.`;
      }
    } else if (strategy === 'COUNSELLOR_ANALYTICS') {
      const payload = {
        filter: apiFilter,
        start_date: startDate,
        end_date: endDate,
        student_ids: entityParams.studentIds || []
      };

      const bulkRes = await postRequest('/export-bulk-student-reports', payload);
      let dataRows = bulkRes?.data?.data || [];

      if (entityParams.group && Array.isArray(dataRows) && dataRows.length > 0) {
        const gName = (entityParams.group.name || '').toLowerCase().trim();
        const gId = String(entityParams.group.id || entityParams.group.center_id || '');
        const filtered = dataRows.filter(row => 
          String(row.center_id) === gId || 
          (row.center_name && row.center_name.toLowerCase().trim() === gName)
        );
        if (filtered.length > 0) dataRows = filtered;
      }

      if (Array.isArray(dataRows) && dataRows.length > 0) {
        dataText = dataRows.map(row => 
          `- Date: ${row.activity_date || ''} | Mentee: ${row.student_name} | Group: ${row.center_name || 'N/A'} | Activity: ${row.activity_name} | Value: ${row.activity_value} | Marks: ${row.activity_marks}`
        ).join('\n');
      } else {
        const groupLabel = entityParams.group ? `Group "${entityParams.group.name}"` : 'All Groups';
        dataText = `Analytics (${startDate} to ${endDate}) for ${groupLabel}: No activity records logged in this timeframe.`;
      }
    } else if (strategy === 'CUSTOM_CALLBACK' && typeof entityParams.customFetchFn === 'function') {
      dataText = await entityParams.customFetchFn({ startDate, endDate, apiFilter, preset });
    }
  } catch (err) {
    console.warn(`collectAndRedirectToChatGPT issue [${strategy}]:`, err);
    dataText = `Assessment period: ${startDate} to ${endDate}. Note: Direct backend data fetch warning, analyzing general logs for this period.`;
  }

  notify("Constructing prompt & redirecting to ChatGPT...");

  const contextTitle = entityParams.contextName || entityParams.studentName || 'Sadhana Report Analysis';
  const fullPrompt = buildSadhanaPrompt({
    contextName: contextTitle,
    startDate,
    endDate,
    studentCount,
    dataText
  });

  await openChatGPTWithPrompt(fullPrompt, newWindowHandle);
};
