// src/api/markingSchemes.js
import { postRequest, getRequest } from '../services/api';

export const getCenters = async () => {
  const userDetails = JSON.parse(localStorage.getItem('user_details') || '{}');
  const userId = userDetails.user_id;
  return new Promise((resolve) => {
    getRequest('/group-list', { user_id: userId, page_no: 1 }, (response) => {
      if (response?.data?.code === 200 && response.data.data) {
        const raw = Array.isArray(response.data.data) ? response.data.data : (response.data.data.data || []);
        resolve(raw.map(c => ({ id: c.center_id, name: c.name || 'Unnamed Group' })));
      } else {
        resolve([]);
      }
    });
  });
};

export const getLabels = async () => {
  return new Promise((resolve) => {
    getRequest('/lable-list', {}, (response) => {
      if (response?.data?.code === 200 && response.data.data) {
        const raw = Array.isArray(response.data.data) ? response.data.data : (response.data.data.data || []);
        resolve(raw.map(l => ({ id: l.id, name: l.name || 'Unnamed Subgroup' })));
      } else {
        resolve([]);
      }
    });
  });
};

export const getLabelsRaw = async () => {
  return new Promise((resolve) => {
    getRequest('/lable-list', {}, (response) => {
      if (response?.data?.code === 200 && response.data.data) {
        const raw = Array.isArray(response.data.data) ? response.data.data : (response.data.data.data || []);
        resolve(raw);
      } else {
        resolve([]);
      }
    });
  });
};

export const getGroupSubgroupList = async () => {
  const userDetails = JSON.parse(localStorage.getItem('user_details') || '{}');
  const userId = userDetails.user_id;
  return new Promise((resolve) => {
    getRequest('/group-subgroup-list', { user_id: userId }, (response) => {
      if (response?.data?.code === 200 && response.data.data) {
        resolve(response.data.data);
      } else {
        resolve([]);
      }
    });
  });
};



const LOCAL_KEY = 'mock_marking_schemes_data';
const LOCAL_SCHEMES_KEY = 'mock_custom_schemes_list';
let cachedGroupsPromise = null; // Cache the promise so we only hit the backend ONCE

const artificialDelay = (ms = 200) => new Promise(res => setTimeout(res, ms));

const fetchRealGroupsAndSync = async () => {
  // If we already fetched (or are currently fetching), wait for that same promise
  if (cachedGroupsPromise) return cachedGroupsPromise;

  cachedGroupsPromise = new Promise((resolve) => {
    try {
      const userDetailsStr = localStorage.getItem('user_details');
      if (!userDetailsStr) {
        resolve({ groups: [] });
        return;
      }

      const userDetails = JSON.parse(userDetailsStr);
      const userId = userDetails.user_id;

      // Call your actual backend endpoint ONCE with a 3-second timeout
      // to prevent the frontend from freezing when the backend database is down.
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Backend took too long (DB is likely down)")), 3000);
      });

      const apiPromise = new Promise((resolveApi) => {
        getRequest('/group-list', { user_id: userId, page_no: 1 }, (response) => {
          resolveApi(response);
        });
      });

      Promise.race([apiPromise, timeoutPromise])
        .then((response) => {
          clearTimeout(timeoutId);
          const resData = response?.data;
          let dbGroups = [];

          if (resData && resData.code === 200) {
            const rawGroups = Array.isArray(resData.data) ? resData.data :
              (resData.data && Array.isArray(resData.data.data) ? resData.data.data : []);

            dbGroups = rawGroups.map(g => ({
              id: g.id || g.center_id,
              name: g.name || g.center_name || 'Unnamed Group', // Fallback name
              memberCount: g.total_student || 0
            }));
          }

          processGroups(dbGroups);
        })
        .catch((err) => {
          console.error("Backend failed or timed out:", err.message);
          // BACKEND IS DOWN: Supply fallback mock groups so the UI doesn't break
          processGroups([
            { id: 991, name: "Mock DB Down Group A", memberCount: 15 },
            { id: 992, name: "Mock DB Down Group B", memberCount: 8 }
          ]);
        });

      function processGroups(dbGroups) {
        const localSavedData = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{"groups": []}');

        const mergedGroups = dbGroups.map(dbGroup => {
          const localMatch = localSavedData.groups.find(lg => lg.id === dbGroup.id);
          return {
            ...dbGroup,
            markingSchemeId: localMatch && localMatch.markingSchemeId !== undefined
              ? localMatch.markingSchemeId
              : 1
          };
        });

        const finalData = { groups: mergedGroups };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(finalData));
        resolve(finalData);
      }
    } catch (err) {
      console.error("Failed to sync real groups:", err);
      resolve({ groups: [] });
    }
  });

  return cachedGroupsPromise;
};

// If data changes locally (assignments), update cache and localStorage
const updateLocalData = (data) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  cachedGroupsPromise = Promise.resolve(data);
};

export const getSchemes = async (includeProvisional = false) => {
  const userDetails = JSON.parse(localStorage.getItem('user_details') || '{}');
  const counsellorId = userDetails.user_id;

  if (!counsellorId) {
    return { schemes: [] };
  }

  return new Promise((resolve, reject) => {
    postRequest('/scheme-list', { counsellor_id: counsellorId }, (response) => {
      if (response?.data?.code === 200 && response.data.data) {
        let schemes = response.data.data.schemes || [];
        
        // Filter out provisional ones if not requested
        if (!includeProvisional) {
          schemes = schemes.filter(s => !s.isProvisional);
        }
        
        resolve({ schemes });
      } else {
        resolve({ schemes: [] }); // Fallback to empty array on failure to prevent app crashes
      }
    });
  });
};

export const getSchemeGroups = async (schemeId) => {
  const data = await fetchRealGroupsAndSync();
  const schemeGroups = (data.groups || []).filter(g => g.markingSchemeId === schemeId);

  return {
    schemeId,
    groupCount: schemeGroups.length,
    groups: schemeGroups.map(g => ({ id: g.id, name: g.name, memberCount: g.memberCount }))
  };
};

export const searchContentGroups = async (query) => {
  const data = await fetchRealGroupsAndSync();

  const q = (query || "").toLowerCase();

  // Bulletproof search to prevent undefined crashes
  const matched = (data.groups || []).filter(g => {
    const gName = g.name || "";
    return gName.toLowerCase().includes(q);
  });

  return {
    groups: matched.map(g => {
      let schemeObj = null;
      if (g.markingSchemeId === 1) schemeObj = { id: 1, name: "Default Scheme", isLocked: false };
      else if (g.markingSchemeId === 2) schemeObj = { id: 2, name: "Custom Scheme", isLocked: true };

      return {
        id: g.id,
        name: g.name,
        memberCount: g.memberCount,
        markingScheme: schemeObj
      };
    })
  };
};

export const assignGroupsToScheme = async (schemeId, groupIds) => {
  await artificialDelay();
  const data = await fetchRealGroupsAndSync();

  data.groups = data.groups.map(g => {
    if (groupIds.includes(g.id)) {
      return { ...g, markingSchemeId: schemeId };
    }
    return g;
  });

  updateLocalData(data);
  return { schemeId, updatedGroupIds: groupIds };
};

export const removeGroupFromScheme = async (schemeId, groupId) => {
  await artificialDelay();
  const data = await fetchRealGroupsAndSync();

  data.groups = data.groups.map(g => {
    if (g.id === groupId && g.markingSchemeId === schemeId) {
      return { ...g, markingSchemeId: 1 };
    }
    return g;
  });

  updateLocalData(data);
  return { groupId, newSchemeId: 1 };
};

// ==========================================
// MOCK APIS FOR EDITING MARKING SCHEMES
// TODO: Replace these local mock functions with real API calls using fetch/axios later.
// ==========================================

export const getActivities = async (schemeId) => {
  const userDetails = JSON.parse(localStorage.getItem('user_details') || '{}');
  const counsellorId = userDetails.user_id;
  if (!counsellorId) throw new Error("User not authenticated.");

  return new Promise((resolve) => {
    postRequest('/scheme-activities-list', { scheme_id: schemeId, counsellor_id: counsellorId }, (response) => {
      if (response?.data?.code === 200 && response.data.data) {
        resolve({ activities: response.data.data });
      } else {
        resolve({ activities: [] });
      }
    });
  });
};

export const getSchemeActivities = async (schemeId) => {
  return new Promise((resolve) => {
    postRequest('/marking-rules', { center_id: schemeId }, (response) => {
      if (response?.data?.code === 200 && response.data.data && response.data.data.length > 0) {
        const rules = response.data.data;
        
        // Group flat rules by master_activity_id
        const grouped = {};
        rules.forEach(rule => {
          const actId = rule.master_activity_id;
          if (!grouped[actId]) {
            // Map standard icons based on activity title
            let icon = '🎯';
            const name = rule.activity_name || '';
            if (name.toLowerCase().includes('chant')) icon = '📿';
            else if (name.toLowerCase().includes('read')) icon = '📖';
            else if (name.toLowerCase().includes('hear')) icon = '👂';
            else if (name.toLowerCase().includes('service') || name.toLowerCase().includes('clean')) icon = '🧹';
            else if (name.toLowerCase().includes('shloka') || name.toLowerCase().includes('memorise')) icon = '📜';

            grouped[actId] = {
              id: actId,
              title: rule.activity_name,
              icon: icon,
              maxMarks: 0,
              badge: rule.frequency || 'Daily',
              rows: []
            };
          }

          // Reconstruct condition string for frontend UI parser
          let conditionStr = rule.condition_value;
          if (rule.condition_operator && rule.condition_operator !== '=') {
            conditionStr = `${rule.condition_operator} ${rule.condition_value}`;
          }

          grouped[actId].rows.push({
            id: rule.id,
            condition: conditionStr,
            marks: rule.marks
          });

          // Track the maximum marks
          if (rule.marks > grouped[actId].maxMarks) {
            grouped[actId].maxMarks = rule.marks;
          }
        });

        resolve({ activities: Object.values(grouped) });
      } else {
        // Fallback to static mocks if no rules exist in the database yet
        if (schemeId === 1) {
          resolve({
            activities: [
              {
                id: 'def1',
                title: 'Chanting',
                icon: '📿',
                maxMarks: 25,
                badge: 'Daily',
                rows: [{ condition: 'Completed Target', marks: 25 }]
              },
              {
                id: 'def2',
                title: 'Reading',
                icon: '📖',
                maxMarks: 20,
                badge: 'Daily',
                rows: [{ condition: '20 min', marks: 20 }]
              },
              {
                id: 'def3',
                title: 'Hearing',
                icon: '👂',
                maxMarks: 20,
                badge: 'Daily',
                rows: [{ condition: '20 min', marks: 20 }]
              }
            ]
          });
        } else {
          const customSchemes = JSON.parse(localStorage.getItem(LOCAL_SCHEMES_KEY) || '[]');
          const scheme = customSchemes.find(s => s.id === schemeId);
          resolve({
            activities: scheme ? (scheme.activities || []) : []
          });
        }
      }
    });
  });
};

export const saveScheme = async (name, activities, schemeId = null, isProvisional = false, assignCenterId = null, assignLabelId = null) => {
  const customSchemes = JSON.parse(localStorage.getItem(LOCAL_SCHEMES_KEY) || '[]');
  
  if (isProvisional) {
    // DO NOT hit backend for temporary drafts/clones
    if (schemeId) {
      const index = customSchemes.findIndex(s => s.id === schemeId);
      if (index >= 0) {
        customSchemes[index] = { ...customSchemes[index], name, activities, isProvisional };
        localStorage.setItem(LOCAL_SCHEMES_KEY, JSON.stringify(customSchemes));
        return { scheme: customSchemes[index] };
      }
    }
    const newScheme = {
      id: Date.now(), 
      name,
      activities,
      isEnabled: true,
      isProvisional
    };
    customSchemes.push(newScheme);
    localStorage.setItem(LOCAL_SCHEMES_KEY, JSON.stringify(customSchemes));
    return { scheme: newScheme };
  }

  // Production Backend Saving
  const userDetails = JSON.parse(localStorage.getItem('user_details') || '{}');
  const counsellorId = userDetails.user_id;
  if (!counsellorId) throw new Error("User not authenticated.");

  const targetCenterId = schemeId || Date.now(); 
  const payload = {
    center_id: targetCenterId,
    counsellor_id: counsellorId,
    name: name,
    isProvisional: isProvisional,
    activities: activities,
    assign_center_id: assignCenterId,
    assign_label_id: assignLabelId
  };

  return new Promise((resolve, reject) => {
    postRequest('/save-marking-scheme', payload, (response) => {
      if (response && response.data && response.data.code === 200) {
        const finalSchemeId = response.data.data?.schemeId || targetCenterId;
        const existingIdx = customSchemes.findIndex(s => s.id === targetCenterId);
        const savedScheme = { id: finalSchemeId, name, activities, isEnabled: true, isProvisional: false };
        if (existingIdx >= 0) customSchemes[existingIdx] = savedScheme;
        else customSchemes.push(savedScheme);
        localStorage.setItem(LOCAL_SCHEMES_KEY, JSON.stringify(customSchemes));
        
        resolve({ scheme: savedScheme });
      } else {
        reject(new Error(response?.data?.message?.[0] || "Failed to save scheme to database."));
      }
    });
  });
};

export const createScheme = async (name, groupId = null, subgroupId = null) => {
  const userDetails = JSON.parse(localStorage.getItem('user_details') || '{}');
  const counsellorId = userDetails.user_id;
  if (!counsellorId) throw new Error("User not authenticated.");

  const payload = {
    name,
    counsellor_id: counsellorId,
    group_id: groupId,
    subgroup_id: subgroupId
  };

  return new Promise((resolve, reject) => {
    postRequest('/create-marking-scheme', payload, (response) => {
      if (response && response.data && response.data.code === 200) {
        const savedScheme = response.data.data;
        const customSchemes = JSON.parse(localStorage.getItem(LOCAL_SCHEMES_KEY) || '[]');
        customSchemes.push(savedScheme);
        localStorage.setItem(LOCAL_SCHEMES_KEY, JSON.stringify(customSchemes));
        resolve({ scheme: savedScheme });
      } else {
        reject(new Error(response?.data?.message?.[0] || "Failed to create scheme."));
      }
    });
  });
};

export const deleteScheme = async (schemeId) => {
  const userDetails = JSON.parse(localStorage.getItem('user_details') || '{}');
  const counsellorId = userDetails.user_id;
  if (!counsellorId) throw new Error('User not authenticated.');

  return new Promise((resolve, reject) => {
    postRequest(
      '/delete-marking-scheme',
      { scheme_id: schemeId, counsellor_id: counsellorId },
      (response) => {
        if (response?.data?.code === 200) {
          resolve({ success: true });
        } else {
          reject(new Error(response?.data?.message?.[0] || 'Failed to delete scheme.'));
        }
      }
    );
  });
};

export const toggleSchemeStatus = async (schemeId, isEnabled) => {
  await artificialDelay(200);

  if (schemeId === 1) {
    localStorage.setItem('DEFAULT_SCHEME_ENABLED', isEnabled ? 'true' : 'false');
    return { success: true };
  }

  const customSchemes = JSON.parse(localStorage.getItem(LOCAL_SCHEMES_KEY) || '[]');
  const index = customSchemes.findIndex(s => s.id === schemeId);
  if (index >= 0) {
    customSchemes[index] = { ...customSchemes[index], isEnabled };
    localStorage.setItem(LOCAL_SCHEMES_KEY, JSON.stringify(customSchemes));
  }
  return { success: true };
};

export const deleteActivityFromScheme = async (schemeId, activityId) => {
  await artificialDelay(200);
  // Log deletion. Real backend would process this here.
  console.log(`[Mock API] Deleted activity ${activityId} from scheme ${schemeId}`);
  return { success: true };
};

