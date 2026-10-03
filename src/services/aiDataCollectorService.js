import { postRequest, getRequest } from './api';
import { openChatGPTWithPrompt, buildSadhanaParts, openChatGPTWithParts, buildCompactStudentData, getDateRangeForPreset } from '../utils/chatGptUtils';

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
      // Whole subgroup / group: let the server select every student (not just
      // the ones on the page currently shown on screen).
      if (!payload.student_ids.length) {
        if (entityParams.centerId) payload.center_id = entityParams.centerId;
        if (entityParams.labelId) payload.label_id = entityParams.labelId;
      }

      const res = await postRequest('/export-bulk-student-reports', payload);
      const dataRows = res?.data?.data || [];

      if (Array.isArray(dataRows) && dataRows.length > 0) {
        const compact = buildCompactStudentData(dataRows, { startDate, endDate });
        dataText = compact.text;
        studentCount = compact.studentCount;
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
      // Filter by group on the SERVER (by id). The old client-side filter
      // matched on fields the API doesn't return and silently fell back to
      // every group's data.
      const gId = entityParams.group ? (entityParams.group.id || entityParams.group.center_id) : null;
      if (gId) payload.center_id = gId;

      const bulkRes = await postRequest('/export-bulk-student-reports', payload);
      const dataRows = bulkRes?.data?.data || [];

      if (Array.isArray(dataRows) && dataRows.length > 0) {
        const compact = buildCompactStudentData(dataRows, { startDate, endDate });
        dataText = compact.text;
        studentCount = compact.studentCount;
      } else {
        const groupLabel = entityParams.group ? `Group "${entityParams.group.name}"` : 'All Groups';
        dataText = `Analytics (${startDate} to ${endDate}) for ${groupLabel}: No activity records logged in this timeframe.`;
      }
    } else if (strategy === 'CUSTOM_CALLBACK' && typeof entityParams.customFetchFn === 'function') {
      dataText = await entityParams.customFetchFn({ startDate, endDate, apiFilter, preset });
    }
  } catch (err) {
    console.warn(`collectAndRedirectToChatGPT issue [${strategy}]:`, err);
    // Never send ChatGPT a placeholder instead of the real data — surface the
    // failure so the caller can tell the user and let them retry.
    throw err;
  }

  notify("Constructing prompt & redirecting to ChatGPT...");

  const contextTitle = entityParams.contextName || entityParams.studentName || 'Sadhana Report Analysis';
  const parts = buildSadhanaParts({
    contextName: contextTitle,
    startDate,
    endDate,
    studentCount,
    dataText
  });

  return await openChatGPTWithParts(parts, newWindowHandle);
};
