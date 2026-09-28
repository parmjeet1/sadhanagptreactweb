import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import { postRequest } from '../../../services/api';

const mapDBRulesToDraftScheme = (rules) => {
  const scheme = {};
  rules.forEach(rule => {
    const key = `activity_${rule.master_activity_id}`;
    if (!scheme[key]) {
      let icon = '🎯';
      const name = rule.activity_name || '';
      if (name.toLowerCase().includes('chant')) icon = '📿';
      else if (name.toLowerCase().includes('read')) icon = '📖';
      else if (name.toLowerCase().includes('hear')) icon = '👂';
      else if (name.toLowerCase().includes('service') || name.toLowerCase().includes('clean')) icon = '🧹';
      else if (name.toLowerCase().includes('shloka') || name.toLowerCase().includes('memorise')) icon = '📜';
      else if (name.toLowerCase().includes('sleep')) icon = '😴';
      else if (name.toLowerCase().includes('wake')) icon = '🌅';
      else if (name.toLowerCase().includes('mangal') || name.toLowerCase().includes('aarti')) icon = '🙏';

      scheme[key] = {
        id: rule.master_activity_id,
        title: rule.activity_name || 'Unknown Activity',
        icon: icon,
        badge: rule.frequency || 'Daily',
        maxMarks: rule.is_max_marks ? rule.marks : 25,
        rows: []
      };
    }
    
    let conditionStr = rule.condition_value;
    if (rule.condition_operator && rule.condition_operator !== '=') {
      conditionStr = `${rule.condition_operator} ${rule.condition_value}`;
    }

    scheme[key].rows.push({
      condition: conditionStr,
      marks: rule.marks
    });
    
    if (rule.is_max_marks) {
        scheme[key].maxMarks = rule.marks;
    }
  });
  
  return scheme;
};

const parseCondition = (conditionStr) => {
  const opMap = {
    '>=': 'At least',
    '<=': 'Upto',
    '>': 'After',
    '<': 'Before'
  };

  const str = (conditionStr || '').trim();
  
  for (const [op, text] of Object.entries(opMap)) {
    if (str.startsWith(op)) {
      let remainder = str.substring(op.length).trim();
      remainder = remainder.replace(/\bboolean\b/gi, 'days');
      return { value: remainder, rule: text };
    }
  }

  const rules = ["Before", "After", "Up To", "Up to", "At Least", "Exact Time", "Yes", "No"];
  const lowerStr = str.toLowerCase();
  
  for (const rule of rules) {
    const lowerRule = rule.toLowerCase();
    if (lowerStr.startsWith(lowerRule)) {
      let remainder = str.substring(rule.length).trim();
      remainder = remainder.replace(/\bboolean\b/gi, 'days');
      let titleCaseRule = rule.toLowerCase() === "up to" ? "Up To" : rule;
      titleCaseRule = titleCaseRule.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      return { value: remainder || str, rule: titleCaseRule };
    }
  }
  
  return { value: str.replace(/\bboolean\b/gi, 'days'), rule: "" };
};

const SchemeTable = ({ data }) => {
  return (
    <div className="bg-[#FFFFFF] dark:bg-[#132B5A] rounded-[16px] p-[16px] sm:p-[20px] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-none flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg break-words w-full">

      {/* Card Header */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[18px]">
            {data.icon}
          </div>
          <div>
            <h3 className="font-bold text-[15px] sm:text-[16px] text-[#0F172A] dark:text-white leading-tight">{data.title}</h3>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-[#6b7a99] uppercase tracking-wide">
              {data.badge} Activity
            </span>
          </div>
        </div>
        <div className="flex items-center h-8 gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-[#059669]/10 dark:bg-[rgba(0,212,170,0.15)] text-[#059669] dark:text-[#00D4AA] text-[13px] font-bold border border-transparent shadow-sm">
            Max {data.maxMarks} pts
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="pt-4 flex-1 flex flex-col relative">
        <div className="grid grid-cols-3 gap-2 pb-2 mb-2 border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] px-2">
          <div className="text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Condition-Values</div>
          <div className="text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider">Conditions</div>
          <div className="text-[10px] sm:text-[11px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider text-right sm:text-left sm:pl-6">Marks</div>
        </div>

        <div className="flex flex-col flex-1 relative gap-1">
          {data.rows && data.rows.length > 0 ? (
            data.rows.map((row, idx) => {
              const isPositive = row.marks > 0;
              const isZero = row.marks === 0;
              
              let marksColor = '';
              if (isPositive) marksColor = 'text-[#059669] dark:text-[#00D4AA]';
              else if (isZero) marksColor = 'text-[#64748B] dark:text-[#94A3B8]';
              else marksColor = 'text-[#DC2626] dark:text-[#FF5C5C]';

              const parsed = parseCondition(row.condition);

              return (
                <div key={idx} className="grid grid-cols-3 gap-2 items-center min-h-[36px] bg-slate-50 dark:bg-[rgba(255,255,255,0.02)] rounded-lg px-2 hover:bg-slate-100 dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-200">
                  <div className="text-[12px] text-[#0F172A] dark:text-gray-200 font-semibold truncate pr-2">{parsed.value}</div>
                  <div className="text-[12px] text-[#64748B] dark:text-gray-400 font-medium truncate pr-2">{parsed.rule}</div>
                  <div className="flex items-center justify-end sm:justify-start sm:pl-6">
                    <span className={`text-[13px] font-bold ${marksColor}`}>
                      {row.marks > 0 ? `+${row.marks}` : row.marks} pts
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500 text-[13px]">No conditions configured.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const DefaultSchemeDetail = () => {
  const navigate = useNavigate();
  const [originalScheme, setOriginalScheme] = useState({});
  const [availableActivities, setAvailableActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRules = () => {
    setIsLoading(true);
    const userDetailsStr = localStorage.getItem('user_details');
    const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : {};

    postRequest('/marking-rules', { scheme_id: 1, user_id: userDetails.user_id }, (response) => {
      if (response?.data?.code === 200 && Array.isArray(response.data.data)) {
        const mapped = mapDBRulesToDraftScheme(response.data.data);
        setOriginalScheme(mapped);
        
        // Populate dropdown options based on what's ACTUALLY fetched
        const activitiesList = Object.entries(mapped).map(([key, data]) => ({
          id: key.replace('activity_', ''),
          name: data.title,
          icon: data.icon
        }));
        
        setAvailableActivities(activitiesList);

        if (activitiesList.length > 0 && !selectedActivity) {
          setSelectedActivity(activitiesList[0].id);
        }
      } else {
        setOriginalScheme({});
        setAvailableActivities([]);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const calculateTotalMarks = (scheme) => {
    return Object.values(scheme).reduce((acc, curr) => acc + curr.maxMarks, 0);
  };

  const totalActivities = Object.keys(originalScheme).length;
  const currentTotalMarks = calculateTotalMarks(originalScheme);

  if (isLoading && totalActivities === 0) {
    return <div className="min-h-screen bg-[#0b1628] flex items-center justify-center text-[#6b7a99]">Loading default rules...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A192F] font-sans pb-28 transition-colors duration-300 flex flex-col relative">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0A192F]/80 backdrop-blur-xl border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] px-[12px] min-[380px]:px-[16px] md:px-[20px] lg:px-[24px] py-4 transition-all duration-300 box-border shadow-sm">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-[200px]">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center text-slate-500 dark:text-[#6b7a99] hover:bg-slate-100 dark:hover:bg-[rgba(255,255,255,0.06)] active:scale-90 transition-all"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[16px] sm:text-[18px] font-bold text-[#0F172A] dark:text-white leading-none tracking-tight truncate">System Default Rules</h1>
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-[rgba(255,255,255,0.1)] text-slate-600 dark:text-slate-300 text-[9px] font-bold uppercase rounded-full tracking-wide">Read Only</span>
                </div>
                <p className="text-[11px] sm:text-[12px] font-medium text-slate-500 dark:text-[#6b7a99] mt-1.5 truncate">View the global evaluation rules.</p>
              </div>
              
              {/* Premium Dropdown */}
              <div className="relative mt-2 sm:mt-0 sm:ml-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <svg className="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <select
                  value={selectedActivity}
                  onChange={(e) => setSelectedActivity(e.target.value)}
                  className="pl-9 pr-8 py-2 w-full sm:w-[220px] appearance-none bg-white dark:bg-[#132B5A] border border-gray-200 dark:border-[rgba(255,255,255,0.1)] rounded-xl text-[13px] font-bold text-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow shadow-sm cursor-pointer"
                >
                  {availableActivities.length === 0 ? (
                     <option value="">No Activities Added</option>
                  ) : (
                    availableActivities.map(act => (
                      <option key={act.id} value={act.id}>
                        {act.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-[90%] max-w-[1080px] mx-auto px-[12px] min-[380px]:px-[16px] md:px-[20px] lg:px-[24px] py-8 transition-all duration-300 box-border">

        {/* KPI Section */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 md:mb-10">
          <div className="bg-[#FFFFFF] dark:bg-[#132B5A] rounded-[18px] p-4 sm:p-8 border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] shadow-sm dark:shadow-none flex flex-col justify-center h-[100px] sm:h-[126px] backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 transition-transform hover:scale-[1.02]">
            <p className="text-[11px] sm:text-[13px] font-bold text-slate-500 dark:text-gray-400 mb-1 sm:mb-2 uppercase tracking-wide">Configured Activities</p>
            <h2 className="text-[28px] sm:text-[38px] font-black text-[#0F172A] dark:text-white leading-none">{totalActivities}</h2>
          </div>

          <div className={`bg-gradient-to-br from-teal-500 to-emerald-600 dark:from-[rgba(29,233,182,0.15)] dark:to-[rgba(29,233,182,0.05)] border border-transparent dark:border-[rgba(29,233,182,0.3)] rounded-[18px] p-4 sm:p-8 shadow-md flex flex-col justify-center h-[100px] sm:h-[126px] text-white transition-transform hover:scale-[1.02]`}>
            <p className={`text-[11px] sm:text-[13px] font-bold mb-1 sm:mb-2 text-teal-50 dark:text-[#1de9b6] uppercase tracking-wide`}>Max Possible Marks</p>
            <h2 className={`text-[28px] sm:text-[38px] font-black leading-none text-white`}>{currentTotalMarks}</h2>
          </div>
        </div>

        {/* Marking Scheme Grid */}
        <div className="flex justify-center">
          {selectedActivity ? (
            originalScheme[`activity_${selectedActivity}`] ? (
              <SchemeTable
                key={selectedActivity}
                data={originalScheme[`activity_${selectedActivity}`]}
              />
            ) : (
              <div className="w-full text-center py-12 bg-[#FFFFFF] dark:bg-[#132B5A] rounded-[16px] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] shadow-sm">
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  No rules configured for this activity yet.
                </p>
              </div>
            )
          ) : (
            <div className="w-full text-center py-12 text-slate-500 dark:text-[#6b7a99] bg-white dark:bg-[#132B5A] border border-dashed border-gray-300 dark:border-[rgba(255,255,255,0.1)] rounded-[16px]">
              <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-[15px] font-bold text-slate-700 dark:text-white mb-1">No activities selected</h3>
              <p className="text-[13px]">There are no rules configured in the default marking scheme yet.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DefaultSchemeDetail;
