import ThemeToggle from '../../components/shared/ThemeToggle';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CounsellorBottomNavigation from '../../components/counsellor/CounsellorBottomNavigation';
import { postRequest } from '../../services/api';
import {
  analyzeBirdsEyeStudents,
  getPreviousCompletedWeekRange,
  countPeriodDays,
  formatDateRangeShort,
} from '../../utils/birdsEyeAnalytics';

// Pastel card treatment per status — subtle, not harsh warning colors
// (spec section 11).
const STATUS_STYLES = {
  green: { card: 'bg-emerald-50 hover:bg-emerald-100/50 border border-emerald-100 dark:bg-[#1e293b] dark:hover:bg-[#1e293b]/80 dark:border-[#334155]', dot: 'bg-emerald-500 dark:bg-emerald-400', text: 'text-emerald-700 dark:text-emerald-400' },
  amber: { card: 'bg-amber-50 hover:bg-amber-100/50 border border-amber-100 dark:bg-[#1e293b] dark:hover:bg-[#1e293b]/80 dark:border-[#334155]', dot: 'bg-amber-500 dark:bg-amber-400', text: 'text-amber-700 dark:text-amber-400' },
  red: { card: 'bg-red-50/70 hover:bg-red-50 border-2 border-red-100 dark:bg-[#261B27] dark:hover:bg-[#321D28] dark:border-[#C44050]', dot: 'bg-red-400 dark:bg-red-500', text: 'text-red-600 dark:text-red-400' },
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'good', label: 'Good' },
  { value: 'struggling', label: 'Struggling' },
  { value: 'no_data', label: 'No Data' },
];

const StudentRow = ({ student, onOpenStudent }) => {
  const style = STATUS_STYLES[student.color] || STATUS_STYLES.amber;
  return (
    <div className={`rounded-2xl p-3.5 mb-2 transition-colors ${style.card} sm:flex sm:items-center sm:justify-between sm:gap-4`}>
      <div className="sm:flex-1 sm:min-w-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
          <button
            type="button"
            onClick={() => onOpenStudent(student)}
            className="font-bold text-[14px] text-[#0f172a] dark:text-white hover:underline text-left truncate"
          >
            {student.name}
          </button>
        </div>
        <p className={`text-[12.5px] font-semibold mt-1 ${style.text} truncate`}>{student.statusText}</p>
      </div>
      <div className="sm:flex-1 sm:min-w-0 mt-1.5 sm:mt-0">
        <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium truncate">{student.action}</p>
      </div>
      <div className="sm:shrink-0 mt-1.5 sm:mt-0">
        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap">Reported {student.loggedDays}/{student.periodDays} days</span>
      </div>
    </div>
  );
};

const BirdsEyeView = () => {
  const navigate = useNavigate();
  const { userDetails } = useOutletContext();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [rawRows, setRawRows] = useState([]);

  const defaultWeek = useMemo(() => getPreviousCompletedWeekRange(), []);
  const [startDate, setStartDate] = useState(defaultWeek.startDate);
  const [endDate, setEndDate] = useState(defaultWeek.endDate);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customStartDraft, setCustomStartDraft] = useState(defaultWeek.startDate);
  const [customEndDraft, setCustomEndDraft] = useState(defaultWeek.endDate);

  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [subgroupFilter, setSubgroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());
  const [collapsedSubgroups, setCollapsedSubgroups] = useState(() => new Set());

  const periodDays = useMemo(() => countPeriodDays(startDate, endDate), [startDate, endDate]);

  // Data reload ONLY on date-range change (spec section 23) — search/filter
  // work entirely off the already-fetched dataset.
  const fetchData = useCallback(() => {
    setIsLoading(true);
    setErrorMsg('');
    postRequest('/export-bulk-student-reports', {
      // FIX (counsellor-scoping leak): backend requires user_id to scope
      // results to the requesting counsellor's own mentees only — without
      // it the endpoint used to return every counsellor's students/groups.
      user_id: userDetails.user_id,
      filter: 'custom',
      start_date: startDate,
      end_date: endDate,
      // No center_id / label_id / student_ids -> every mentee for this
      // counsellor, reusing the SAME bulk endpoint the Export/AI-Analysis
      // features already call (see final report: "Existing APIs reused").
    }, (response) => {
      setIsLoading(false);
      const data = response?.data;
      if (data?.status === 1 && Array.isArray(data.data)) {
        setRawRows(data.data);
      } else {
        setRawRows([]);
        setErrorMsg("Couldn't load mentee data. Please try again.");
      }
    }, () => {
      setIsLoading(false);
      setRawRows([]);
      setErrorMsg("Couldn't load mentee data. Please try again.");
    });
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const students = useMemo(() => analyzeBirdsEyeStudents(rawRows, periodDays), [rawRows, periodDays]);

  // Filter option lists derived straight from the dataset — no extra API
  // calls, and guarantees the dropdowns only ever list a Group/Subgroup
  // that actually has a mentee in it.
  const groupOptions = useMemo(() => {
    const names = new Set(students.map((s) => s.groupName));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [students]);

  const subgroupOptions = useMemo(() => {
    const relevant = groupFilter === 'all' ? students : students.filter((s) => s.groupName === groupFilter);
    const names = new Set(relevant.map((s) => s.subgroupName));
    return Array.from(names).sort((a, b) => {
      if (a === 'No Subgroup') return 1;
      if (b === 'No Subgroup') return -1;
      return a.localeCompare(b);
    });
  }, [students, groupFilter]);

  // Reset subgroup filter if it no longer applies to the newly chosen group.
  useEffect(() => {
    if (subgroupFilter !== 'all' && !subgroupOptions.includes(subgroupFilter)) {
      setSubgroupFilter('all');
    }
  }, [subgroupOptions, subgroupFilter]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (groupFilter !== 'all' && s.groupName !== groupFilter) return false;
      if (subgroupFilter !== 'all' && s.subgroupName !== subgroupFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, groupFilter, subgroupFilter, statusFilter, searchQuery]);

  // GROUP -> SUBGROUP -> STUDENTS (A-Z within every subgroup, performance
  // never affects ordering — spec section 8).
  const hierarchy = useMemo(() => {
    const groupsMap = new Map();
    filteredStudents.forEach((s) => {
      if (!groupsMap.has(s.groupName)) groupsMap.set(s.groupName, new Map());
      const subMap = groupsMap.get(s.groupName);
      if (!subMap.has(s.subgroupName)) subMap.set(s.subgroupName, []);
      subMap.get(s.subgroupName).push(s);
    });

    const groupNames = Array.from(groupsMap.keys()).sort((a, b) => {
      if (a === 'Unassigned Group') return 1;
      if (b === 'Unassigned Group') return -1;
      return a.localeCompare(b);
    });

    return groupNames.map((groupName) => {
      const subMap = groupsMap.get(groupName);
      const subgroupNames = Array.from(subMap.keys()).sort((a, b) => {
        if (a === 'No Subgroup') return 1;
        if (b === 'No Subgroup') return -1;
        return a.localeCompare(b);
      });
      return {
        groupName,
        subgroups: subgroupNames.map((subgroupName) => ({
          subgroupName,
          students: [...subMap.get(subgroupName)].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
        })),
      };
    });
  }, [filteredStudents]);

  const toggleGroupCollapsed = (name) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };
  const toggleSubgroupCollapsed = (key) => {
    setCollapsedSubgroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const applyCustomRange = () => {
    if (!customStartDraft || !customEndDraft) return;
    setStartDate(customStartDraft);
    setEndDate(customEndDraft);
    setIsCustomOpen(false);
  };

  const openStudent = (student) => {
    navigate(`/counsellor/mentee/${student.id}`, { state: { student: { id: student.id, name: student.name } } });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-300 text-[#0f172a] dark:text-white font-sans pb-[84px]">
      <div className="w-full max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-10 pb-1">
          <div className="flex-1 flex justify-start">
            <button onClick={() => navigate('/counsellor/dashboard')} className="text-[#64748b] dark:text-slate-400 font-bold text-sm hover:text-slate-800 dark:hover:text-slate-200 transition-colors pt-1">Back</button>
          </div>
          <div className="text-center shrink-0 px-2">
            <h1 className="text-[19px] font-extrabold text-[#0f172a] dark:text-white leading-tight">Bird's Eye View</h1>
            <p className="text-[11.5px] text-gray-400 dark:text-slate-400 font-medium mt-1">All your mentees at a glance</p>
          </div>
          <div className="flex-1 flex justify-end -mr-3">
            <ThemeToggle />
          </div>
        </div>
        <p className="px-6 text-center text-[11px] text-gray-400 dark:text-slate-500 font-semibold mb-4">
          {startDate === defaultWeek.startDate && endDate === defaultWeek.endDate ? 'Last week: ' : 'Period: '}
          {formatDateRangeShort(startDate, endDate)}
        </p>

        {/* Custom Date Range (compact) */}
        <div className="px-6 mb-4">
          <button
            onClick={() => setIsCustomOpen((v) => !v)}
            className="text-[12px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Custom Date Range
          </button>
          <AnimatePresence>
            {isCustomOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex items-center gap-2 mt-3">
                  <input type="date" value={customStartDraft} onChange={(e) => setCustomStartDraft(e.target.value)} className="flex-1 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2.5 text-[13px] font-medium outline-none border border-transparent focus:border-blue-200 dark:focus:border-blue-500 transition-colors" />
                  <span className="text-gray-300 dark:text-slate-500 text-xs">to</span>
                  <input type="date" value={customEndDraft} onChange={(e) => setCustomEndDraft(e.target.value)} className="flex-1 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-2.5 text-[13px] font-medium outline-none border border-transparent focus:border-blue-200 dark:focus:border-blue-500 transition-colors" />
                  <button onClick={applyCustomRange} className="bg-blue-600 text-white text-[12px] font-bold px-4 py-2.5 rounded-xl shrink-0">Apply</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search */}
        <div className="px-6 mb-3">
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f8fafc] dark:bg-slate-800 dark:text-white dark:placeholder-slate-400 rounded-full py-3 px-5 text-[14px] outline-none border border-transparent dark:border-slate-700 focus:border-blue-200 dark:focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filters: Group / Subgroup / Status — same three everywhere,
            desktop just lays them out in one comfortable row (spec 20/25). */}
        <div className="px-6 pb-4 flex gap-2.5 overflow-x-auto hide-scrollbar sm:overflow-visible sm:flex-wrap">
          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className={`shrink-0 rounded-full px-4 py-2 font-bold text-[12.5px] outline-none border dark:border-slate-700 transition-colors ${groupFilter !== 'all' ? 'bg-blue-600 text-white border-transparent dark:border-transparent' : 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
            <option value="all">All Groups</option>
            {groupOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={subgroupFilter} onChange={(e) => setSubgroupFilter(e.target.value)} className={`shrink-0 rounded-full px-4 py-2 font-bold text-[12.5px] outline-none border dark:border-slate-700 transition-colors ${subgroupFilter !== 'all' ? 'bg-blue-600 text-white border-transparent dark:border-transparent' : 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
            <option value="all">All Subgroups</option>
            {subgroupOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`shrink-0 rounded-full px-4 py-2 font-bold text-[12.5px] outline-none border dark:border-slate-700 transition-colors ${statusFilter !== 'all' ? 'bg-blue-600 text-white border-transparent dark:border-transparent' : 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
            {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : errorMsg ? (
          <div className="px-6 py-16 text-center">
            <p className="text-gray-400 font-medium mb-4">{errorMsg}</p>
            <button onClick={fetchData} className="text-blue-600 font-bold text-sm">Try again</button>
          </div>
        ) : hierarchy.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 dark:text-slate-500 font-medium">
            {students.length === 0 ? 'No mentees found.' : 'No mentees match your search/filters.'}
          </div>
        ) : (
          <div className="px-6 pb-6">
            {hierarchy.map(({ groupName, subgroups }) => {
              const groupCollapsed = collapsedGroups.has(groupName);
              return (
                <div key={groupName} className="mb-4">
                  <button onClick={() => toggleGroupCollapsed(groupName)} className="w-full flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800/80 transition-colors">
                    <span className="font-extrabold text-[15px] text-[#0f172a] dark:text-white">{groupName}</span>
                    <svg className={`w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform ${groupCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <AnimatePresence initial={false}>
                    {!groupCollapsed && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        {subgroups.map(({ subgroupName, students: subStudents }) => {
                          const subKey = `${groupName}::${subgroupName}`;
                          const subCollapsed = collapsedSubgroups.has(subKey);
                          return (
                            <div key={subKey} className="mt-3">
                              <button onClick={() => toggleSubgroupCollapsed(subKey)} className="w-full flex items-center justify-between mb-2">
                                <span className="font-bold text-[12px] uppercase tracking-wider text-gray-400 dark:text-slate-400">{subgroupName}</span>
                                <svg className={`w-3.5 h-3.5 text-gray-300 dark:text-slate-600 transition-transform ${subCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                              </button>
                              <AnimatePresence initial={false}>
                                {!subCollapsed && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    {subStudents.map((student) => (
                                      <StudentRow key={student.id} student={student} onOpenStudent={openStudent} />
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CounsellorBottomNavigation />
    </div>
  );
};

export default BirdsEyeView;
