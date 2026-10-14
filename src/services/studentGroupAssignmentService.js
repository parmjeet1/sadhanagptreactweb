import { getRequest } from './api';

/**
 * Service to fetch student group and subgroup assignment data from backend API.
 * Supports both Counsellor and Mentor / Student side.
 * 
 * @param {string} [studentId] - Target student user_id. If omitted, fetches for the authenticated user.
 * @returns {Promise<{
 *   success: boolean,
 *   data: {
 *     student_id: string,
 *     student_name: string,
 *     group_id: number|null,
 *     group_name: string|null,
 *     subgroup_id: number|null,
 *     subgroup_name: string|null
 *   }|null,
 *   message: string
 * }>}
 */
export const fetchStudentGroupAssignment = (studentId) => {
  return new Promise((resolve) => {
    const params = studentId ? { student_id: studentId } : {};

    getRequest(
      '/student-group-assignment',
      params,
      (response) => {
        const res = response?.data || response;
        if (res && (res.status === 1 || res.code === 200) && res.data) {
          resolve({
            success: true,
            data: {
              student_id: res.data.student_id || studentId || null,
              student_name: res.data.student_name || '',
              group_id: res.data.group_id ?? null,
              group_name: res.data.group_name || null,
              subgroup_id: res.data.subgroup_id ?? null,
              subgroup_name: res.data.subgroup_name || null,
            },
            message: res.message || 'Fetched successfully',
          });
        } else {
          resolve({
            success: false,
            data: null,
            message: res?.message || 'Failed to fetch student group assignment',
          });
        }
      },
      (error) => {
        const errorMsg = error?.response?.data?.message || error?.message || 'Network error occurred';
        resolve({
          success: false,
          data: null,
          message: errorMsg,
        });
      }
    );
  });
};
