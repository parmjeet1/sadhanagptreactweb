import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchStudentGroupAssignment } from '../../services/studentGroupAssignmentService';

/**
 * Reusable StudentGroupAssignment Component
 * 
 * Displays a student's assigned Group and Subgroup names.
 * If either is missing, cleanly displays "Not assigned".
 * Supports both Light and Dark modes matching the SadhanaGPT design system.
 * Works seamlessly on Counsellor, Mentor, and Student sides.
 *
 * @param {Object} props
 * @param {string} [props.studentId] - Target student user_id. Defaults to authenticated user.
 * @param {string} [props.initialGroup] - Optional preloaded group name.
 * @param {string} [props.initialSubgroup] - Optional preloaded subgroup name.
 * @param {any} [props.refreshTrigger] - Trigger refetch when this prop changes.
 * @param {function} [props.onDataLoaded] - Callback with fetched assignment data.
 * @param {'card'|'compact'} [props.variant='card'] - Display layout variant.
 * @param {string} [props.className] - Additional classes for container.
 */
const StudentGroupAssignment = ({
  studentId,
  initialGroup = null,
  initialSubgroup = null,
  refreshTrigger,
  onDataLoaded,
  variant = 'card',
  className = '',
}) => {
  const [group, setGroup] = useState(initialGroup || null);
  const [subgroup, setSubgroup] = useState(initialSubgroup || null);
  const [isLoading, setIsLoading] = useState(!initialGroup && !initialSubgroup);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadAssignment = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    try {
      const res = await fetchStudentGroupAssignment(studentId);
      if (res.success && res.data) {
        const fetchedGroup = res.data.group_name || null;
        const fetchedSubgroup = res.data.subgroup_name || null;
        setGroup(fetchedGroup);
        setSubgroup(fetchedSubgroup);
        if (onDataLoaded) {
          onDataLoaded(res.data);
        }
      } else {
        // If not successful but had initial data, keep initial data
        if (!initialGroup && !initialSubgroup) {
          setIsError(true);
          setErrorMessage(res.message || 'Failed to load group assignment');
        }
      }
    } catch (err) {
      console.error('Error in StudentGroupAssignment:', err);
      setIsError(true);
      setErrorMessage(err?.message || 'Failed to load group assignment');
    } finally {
      setIsLoading(false);
    }
  }, [studentId, initialGroup, initialSubgroup, onDataLoaded]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment, refreshTrigger]);

  // Sync if initial props change
  useEffect(() => {
    if (initialGroup !== undefined && initialGroup !== null) {
      setGroup(initialGroup || null);
    }
    if (initialSubgroup !== undefined && initialSubgroup !== null) {
      setSubgroup(initialSubgroup || null);
    }
  }, [initialGroup, initialSubgroup]);

  // =========================================================================
  // Compact Variant (e.g., for Student Report / Mentee Details header section)
  // =========================================================================
  if (variant === 'compact') {
    return (
      <div
        className={`w-full bg-white dark:bg-[#1e293b] rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-slate-800 transition-colors ${className}`}
      >
        <div className="flex items-center justify-between mb-3.5 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-300">
              Student Group Assignment
            </h3>
          </div>
          <button
            onClick={loadAssignment}
            title="Refresh assignment"
            disabled={isLoading}
            className="p-1 rounded-lg text-gray-400 hover:text-orange-500 active:scale-95 transition-all disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
            <div className="h-16 rounded-2xl bg-gray-100 dark:bg-slate-800/60" />
            <div className="h-16 rounded-2xl bg-gray-100 dark:bg-slate-800/60" />
          </div>
        ) : isError ? (
          /* Error State */
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{errorMessage || 'Failed to load assignment'}</span>
            <button
              onClick={loadAssignment}
              className="text-xs font-black text-rose-700 dark:text-rose-300 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : (
          /* Content */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Group Card */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#fcf8ed]/60 dark:bg-slate-800/40 border border-gray-100/80 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-[#f97316] dark:text-orange-400 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-300">Group</p>
                <p className={`text-[13px] font-bold truncate ${group ? 'text-[#1e293b] dark:text-white' : 'text-gray-400 dark:text-slate-400 italic'}`}>
                  {group || 'Not assigned'}
                </p>
              </div>
              <span
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                  group
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {group ? 'Assigned' : 'None'}
              </span>
            </div>

            {/* Subgroup Card */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#fcf8ed]/60 dark:bg-slate-800/40 border border-gray-100/80 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-[#f97316] dark:text-orange-400 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-300">Subgroup</p>
                <p className={`text-[13px] font-bold truncate ${subgroup ? 'text-[#1e293b] dark:text-white' : 'text-gray-400 dark:text-slate-400 italic'}`}>
                  {subgroup || 'Not assigned'}
                </p>
              </div>
              <span
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                  subgroup
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {subgroup ? 'Assigned' : 'None'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // Standard Card Variant (for Profile pages matching Personal Info styling)
  // =========================================================================
  return (
    <section className={`px-8 mb-10 ${className}`}>
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-[13px] font-black text-gray-400 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
          <span>Student Group Assignment</span>
        </h3>
        <button
          onClick={loadAssignment}
          title="Refresh assignment"
          disabled={isLoading}
          className="text-[12px] font-black text-[#f97316] dark:text-orange-400 hover:opacity-80 active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#1e293b] dark:border-slate-800 dark:text-slate-100 rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-gray-50 transition-colors space-y-8">
        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800/70" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 bg-gray-100 dark:bg-slate-800 rounded" />
                <div className="h-5 w-32 bg-gray-100 dark:bg-slate-800 rounded" />
              </div>
            </div>
            <div className="w-full h-px bg-gray-50 dark:bg-slate-800" />
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800/70" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 bg-gray-100 dark:bg-slate-800 rounded" />
                <div className="h-5 w-32 bg-gray-100 dark:bg-slate-800 rounded" />
              </div>
            </div>
          </div>
        ) : isError ? (
          /* Error State */
          <div className="py-4 px-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {errorMessage || 'Failed to load group assignment'}
              </span>
            </div>
            <button
              onClick={loadAssignment}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 active:scale-95 transition-all"
            >
              Retry
            </button>
          </div>
        ) : (
          /* Content State */
          <>
            {/* Group Field */}
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[#fcf8ed] dark:bg-slate-800/50 flex items-center justify-center text-[#f97316] dark:text-orange-400 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-gray-400 dark:text-gray-300 uppercase tracking-widest mb-1">
                  Group
                </p>
                <p
                  className={`text-[16px] font-bold truncate ${
                    group ? 'text-[#1e293b] dark:text-white' : 'text-gray-400 dark:text-slate-400 italic'
                  }`}
                >
                  {group || 'Not assigned'}
                </p>
              </div>
              <span
                className={`text-[11px] font-extrabold px-3 py-1 rounded-full shrink-0 border ${
                  group
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700'
                }`}
              >
                {group ? 'Assigned' : 'Not assigned'}
              </span>
            </div>

            <div className="w-full h-px bg-gray-50 dark:bg-slate-800" />

            {/* Subgroup Field */}
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[#fcf8ed] dark:bg-slate-800/50 flex items-center justify-center text-[#f97316] dark:text-orange-400 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-gray-400 dark:text-gray-300 uppercase tracking-widest mb-1">
                  Subgroup
                </p>
                <p
                  className={`text-[16px] font-bold truncate ${
                    subgroup ? 'text-[#1e293b] dark:text-white' : 'text-gray-400 dark:text-slate-400 italic'
                  }`}
                >
                  {subgroup || 'Not assigned'}
                </p>
              </div>
              <span
                className={`text-[11px] font-extrabold px-3 py-1 rounded-full shrink-0 border ${
                  subgroup
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800'
                    : 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700'
                }`}
              >
                {subgroup ? 'Assigned' : 'Not assigned'}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default StudentGroupAssignment;
