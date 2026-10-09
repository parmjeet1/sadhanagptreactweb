import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequest, postRequest } from '../../services/api';

const ActivityPickList = ({ onActivityAdded }) => {
  // Pick-list: activities that can be added with one tap (built-in + available custom ones).
  const [pickList, setPickList] = useState([]);
  const [pickLoading, setPickLoading] = useState(true);
  const [pickError, setPickError] = useState('');
  const [pickSearch, setPickSearch] = useState('');
  const [addingId, setAddingId] = useState(null);
  const [pickNotice, setPickNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    getRequest('/addable-activities', {}, (res) => {
      if (cancelled) return;
      const rows = res?.data?.data;
      if (res?.data?.status === 1 && Array.isArray(rows)) {
        setPickList(rows);
      } else {
        setPickList([]);
        setPickError('Could not load the list. You can still create your own below.');
      }
      setPickLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const describeActivity = (a) => {
    const t = a.activity_type;
    if (t === 'yes_no' || t === 'boolean') return 'Yes / No';
    if (t === 'time') return a.target ? `Time · by ${a.target}` : 'Time';
    if (t === 'min') return a.target ? `Duration · ${a.target} min` : 'Duration';
    return a.target ? `Count · ${a.target} ${a.unit || ''}`.trim() : 'Count';
  };

  const handlePick = (activity) => {
    if (addingId) return; // one at a time, so repeated taps cannot double-add
    setAddingId(activity.master_activity_id);
    setPickNotice('');
    postRequest('/add-selected-activities', { master_activity_ids: [activity.master_activity_id] }, (res) => {
      const ok = res?.data?.status === 1;
      if (ok) {
        setPickList((prev) => prev.filter((p) => p.master_activity_id !== activity.master_activity_id));
        setPickNotice(`"${activity.name}" added to your list.`);
        if (onActivityAdded) onActivityAdded(activity);
      } else {
        const msg = res?.data?.message;
        setPickNotice((Array.isArray(msg) ? msg[0] : msg) || 'Could not add this activity. Please try again.');
      }
      setAddingId(null);
    });
  };

  const visiblePicks = pickList.filter((a) => {
    const q = pickSearch.trim().toLowerCase();
    return !q || `${a.name} ${a.description || ''}`.toLowerCase().includes(q);
  });

  return (
              <div className="space-y-3">
                <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Choose from the list</label>
                {pickLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-gray-200 dark:border-slate-700 border-t-[#1a73e8] rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    {pickError && <p className="text-[13px] text-amber-600 font-medium">{pickError}</p>}
                    {pickList.length > 0 && (
                      <input
                        type="text"
                        value={pickSearch}
                        onChange={(e) => setPickSearch(e.target.value)}
                        placeholder="Search activities"
                        className="w-full bg-[#f8fafc] dark:bg-[#0b1628] text-[#0f172a] dark:text-white text-[14px] rounded-2xl py-3 px-4 outline-none border border-transparent focus:border-blue-100 placeholder-gray-400"
                      />
                    )}
                    {pickNotice && <p className="text-[13px] text-green-600 font-semibold" role="status">{pickNotice}</p>}
                    {pickList.length === 0 && !pickError ? (
                      <p className="text-[13px] text-gray-400 font-medium">No more activities to pick. You can create your own below.</p>
                    ) : (
                      <div className="max-h-[240px] overflow-y-auto rounded-2xl border border-gray-100 dark:border-slate-800 divide-y divide-gray-100">
                        {visiblePicks.length === 0 && pickList.length > 0 && (
                          <p className="p-4 text-[13px] text-gray-400 font-medium">No activity matches your search.</p>
                        )}
                        {visiblePicks.map((a) => (
                          <div key={a.master_activity_id} className="flex items-center gap-3 p-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-[14px] font-bold text-[#0f172a] dark:text-white truncate">{a.name}</p>
                              <p className="text-[11px] text-gray-400 font-medium truncate">
                                {describeActivity(a)}{a.is_built_in ? ' · Built-in' : ''}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handlePick(a)}
                              disabled={!!addingId}
                              className="shrink-0 px-4 py-2 rounded-full bg-[#1a73e8] text-white text-[13px] font-bold active:scale-95 transition-all disabled:opacity-50"
                            >
                              {addingId === a.master_activity_id ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
  );
};

const NewActivityModal = ({ isOpen, onClose, onSave, onActivityAdded }) => {
  const [name, setName] = useState('');
  const [trackingType, setTrackingType] = useState('Duration'); // Default select
  const [target, setTarget] = useState('');
  const [period, setPeriod] = useState('AM');
  const [status, setStatus] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const trackingTypes = [
    {
      id: 'Count',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#0b1628] flex items-center justify-center text-gray-400 font-bold text-[10px] tracking-wider mb-2">
          123
        </div>
      )
    },
    {
      id: 'Duration',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#0b1628] flex items-center justify-center text-gray-400 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      )
    },
    {
      id: 'Time',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#0b1628] flex items-center justify-center text-gray-400 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </div>
      ) // Reusing icon style from image visually
    },
    {
      id: 'Yes/No',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-[#0b1628] flex items-center justify-center text-gray-400 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
      )
    }
  ];

  const handleSave = async () => {
    // Basic validation
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    if (onSave) {
      await onSave({
        name: name,
        trackingType: trackingType,
        target: target,
        status: status
      });
    }
    setIsSubmitting(false);
    
    // Reset form
    setName('');
    setTrackingType('Duration');
    setTarget('');
    setStatus('0');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[80] w-full max-w-md mx-auto"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 w-full max-w-md mx-auto bg-white dark:bg-[#0f172a] rounded-t-[32px] shadow-2xl z-[90] flex flex-col"
            style={{
              left: 'auto',
              right: 'max(0px, calc(50% - 224px))'
            }}
          >
            {/* Drag Handle Area - Clickable to close as requested */}
            <div 
              className="w-full pt-4 pb-2 flex justify-center sticky top-0 bg-white dark:bg-[#0f172a] rounded-t-[32px] z-10 cursor-pointer"
              onClick={onClose}
            >
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
            </div>

            <div className="px-6 pb-8 pt-2 max-h-[85vh] overflow-y-auto hide-scrollbar space-y-6">
              <h2 className="text-[24px] font-extrabold text-[#0f172a] dark:text-white">New Activity</h2>

              <ActivityPickList onActivityAdded={onActivityAdded} />

              <div className="flex items-center gap-3 text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800"></div>
                or create your own
                <div className="h-px flex-1 bg-gray-100 dark:bg-slate-800"></div>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Morning Yoga"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#f8fafc] dark:bg-[#0b1628] text-[#0f172a] dark:text-white font-medium text-[15px] rounded-2xl py-4 pl-12 pr-4 outline-none border border-transparent focus:border-blue-100 placeholder-gray-400 transition-all"
                  />
                </div>
              </div>


              {/* Tracking Type Grid */}
              <div className="space-y-3">
                <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tracking Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {trackingTypes.map((type) => {
                    const isSelected = trackingType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setTrackingType(type.id)}
                        className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
                          isSelected 
                            ? 'border-[#1a73e8] bg-[#f0f7ff] dark:bg-[#1e293b]' 
                            : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] hover:border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-[#1a73e8]">
                            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {type.icon}
                        <span className={`text-[14px] font-bold ${isSelected ? 'text-[#0f172a] dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          {type.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Input */}
              {trackingType.toLowerCase() !== 'yes/no' && (
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target</label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow flex items-center">
                      <span className="absolute left-4 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                      </span>
                      <input
                        key={trackingType}
                        type={trackingType.toLowerCase() === 'time' ? 'time' : 'number'}
                        min="0"
                        placeholder={
                          trackingType.toLowerCase() === 'count' ? 'Enter target rounds' :
                          trackingType.toLowerCase() === 'duration' ? 'Enter target duration (mins)' :
                          trackingType.toLowerCase() === 'time' ? '05:00' :
                          'Enter target'
                        }
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full bg-[#f8fafc] dark:bg-[#0b1628] text-[#0f172a] dark:text-white font-medium text-[15px] rounded-2xl py-4 pl-12 pr-4 outline-none border border-transparent focus:border-blue-100 placeholder-gray-400 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Visibility Options */}
              <div className="space-y-3">
                <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  Visibility
                  <div className="group relative flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 text-[10px] cursor-help">
                    ?
                    <div className="absolute bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-lg text-center z-50 normal-case font-medium">
                      Private activities are unlisted and hidden from your mentor completely.
                    </div>
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStatus('0')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      status === '0' 
                        ? 'border-[#1a73e8] bg-[#eff6ff] dark:bg-[#1e293b] text-[#1a73e8] dark:text-[#60a5fa]' 
                        : 'border-transparent bg-[#f8fafc] dark:bg-[#0b1628] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <svg className="w-5 h-5 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-bold text-[14px]">Public</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5 text-center">Share with Mentor</span>
                  </button>

                  <button
                    onClick={() => setStatus('1')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      status === '1' 
                        ? 'border-[#f59e0b] bg-[#fffbeb] dark:bg-[#1e293b] text-[#f59e0b] dark:text-[#fbbf24]' 
                        : 'border-transparent bg-[#f8fafc] dark:bg-[#0b1628] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <svg className="w-5 h-5 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    <span className="font-bold text-[14px]">Private</span>
                    <span className="text-[10px] font-medium opacity-80 mt-0.5 text-center">Unlisted / Hidden</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 pb-4">
                <button 
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-4 text-[15px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="flex-[2] py-4 bg-[#1a73e8] hover:bg-[#155fc3] text-white text-[15px] font-bold rounded-full transition-all active:scale-[0.98] shadow-lg shadow-[#1a73e8]/30 flex flex-col items-center justify-center h-[56px] disabled:opacity-70 disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-[2px] border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Save Activity"
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewActivityModal;
