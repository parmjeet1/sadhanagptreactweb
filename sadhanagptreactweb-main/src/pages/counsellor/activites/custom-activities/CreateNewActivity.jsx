import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateNewActivity = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [activityType, setActivityType] = useState('min'); // default to Duration ('min')
  const [unit, setUnit] = useState('min'); // aligned unit
  const [target, setTarget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically sync unit when activityType changes
  useEffect(() => {
    if (activityType === 'time') {
      setUnit('time');
      setTarget('');
    } else if (activityType === 'yes_no') {
      setUnit('boolean');
      setTarget('1'); // standard boolean target
    } else if (activityType === 'min') {
      setUnit('min');
      setTarget('');
    } else if (activityType === 'numb') {
      setUnit('rounds');
      setTarget('');
    }
  }, [activityType]);

  const trackingTypes = [
    {
      id: 'min',
      label: 'Duration',
      icon: (isSelected) => (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
          isSelected 
            ? 'bg-teal-50 dark:bg-[rgba(29,233,182,0.12)] text-teal-600 dark:text-[#1de9b6]' 
            : 'bg-slate-100 dark:bg-[rgba(255,255,255,0.03)] text-slate-400 dark:text-[#6b7a99]'
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      )
    },
    {
      id: 'numb',
      label: 'Count',
      icon: (isSelected) => (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[10px] tracking-wider mb-2 transition-colors ${
          isSelected 
            ? 'bg-teal-50 dark:bg-[rgba(29,233,182,0.12)] text-teal-600 dark:text-[#1de9b6]' 
            : 'bg-slate-100 dark:bg-[rgba(255,255,255,0.03)] text-slate-400 dark:text-[#6b7a99]'
        }`}>
          123
        </div>
      )
    },
    {
      id: 'time',
      label: 'Time',
      icon: (isSelected) => (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
          isSelected 
            ? 'bg-teal-50 dark:bg-[rgba(29,233,182,0.12)] text-teal-600 dark:text-[#1de9b6]' 
            : 'bg-slate-100 dark:bg-[rgba(255,255,255,0.03)] text-slate-400 dark:text-[#6b7a99]'
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </div>
      )
    },
    {
      id: 'yes_no',
      label: 'Yes/No',
      icon: (isSelected) => (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
          isSelected 
            ? 'bg-teal-50 dark:bg-[rgba(29,233,182,0.12)] text-teal-600 dark:text-[#1de9b6]' 
            : 'bg-slate-100 dark:bg-[rgba(255,255,255,0.03)] text-slate-400 dark:text-[#6b7a99]'
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
      )
    }
  ];

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    if (onSave) {
      await onSave({
        name: name,
        activityType: activityType,
        unit: unit,
        target: activityType === 'yes_no' ? 1 : target
      });
    }
    setIsSubmitting(false);
    
    setName('');
    setActivityType('min');
    setUnit('min');
    setTarget('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[400px] bg-white dark:bg-[#0b1628] rounded-[28px] shadow-2xl border border-gray-150 dark:border-[rgba(255,255,255,0.06)] flex flex-col z-10 transition-colors duration-300"
          >
            {/* Drag Handle Area */}
            <div 
              className="w-full pt-4 pb-2 flex justify-center sticky top-0 bg-white dark:bg-[#0b1628] rounded-t-[28px] z-10 cursor-pointer sm:hidden"
              onClick={onClose}
            >
              <div className="w-[36px] h-[4px] rounded-full bg-slate-200 dark:bg-[rgba(255,255,255,0.15)]"></div>
            </div>

            <div className="px-6 pb-6 pt-2 sm:pt-6 max-h-[85vh] overflow-y-auto custom-scrollbar space-y-5">
              <h2 className="text-[20px] font-extrabold text-gray-900 dark:text-white">New Activity</h2>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-450 dark:text-[#6b7a99] uppercase tracking-wider">Name</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 dark:text-[#6b7a99]">
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Morning Yoga"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#112240] text-gray-800 dark:text-white font-medium text-[14px] rounded-[14px] py-3.5 pl-11 pr-4 outline-none border border-slate-200 dark:border-[rgba(255,255,255,0.1)] focus:border-teal-500 dark:focus:border-[#1de9b6] placeholder-slate-400 dark:placeholder-[rgba(255,255,255,0.3)] transition-all"
                  />
                </div>
              </div>

              {/* Tracking Type Grid */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-450 dark:text-[#6b7a99] uppercase tracking-wider">Tracking Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {trackingTypes.map((type) => {
                    const isSelected = activityType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setActivityType(type.id)}
                        className={`relative flex flex-col items-center justify-center p-4 rounded-[16px] border transition-all ${
                          isSelected 
                            ? 'border-teal-500 dark:border-[#1de9b6] bg-teal-50/20 dark:bg-[rgba(29,233,182,0.05)]' 
                            : 'border-slate-100 dark:border-[rgba(255,255,255,0.06)] bg-slate-50/50 dark:bg-[rgba(255,255,255,0.02)] hover:border-slate-200 dark:hover:border-[rgba(255,255,255,0.1)] hover:bg-slate-100/50 dark:hover:bg-[rgba(255,255,255,0.04)]'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 text-teal-600 dark:text-[#1de9b6]">
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {type.icon(isSelected)}
                        <span className={`text-[13px] font-bold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-slate-400 dark:text-[#6b7a99]'}`}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Unit Selector */}
              {activityType === 'min' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-450 dark:text-[#6b7a99] uppercase tracking-wider">Unit</label>
                  <div className="flex bg-slate-50 dark:bg-[rgba(255,255,255,0.02)] border border-slate-200 dark:border-[rgba(255,255,255,0.06)] rounded-[14px] p-1">
                    <button
                      onClick={() => setUnit('min')}
                      className={`flex-1 py-2 text-[13px] font-bold rounded-[10px] transition-all ${
                        unit === 'min' 
                          ? 'bg-teal-600 dark:bg-[rgba(29,233,182,0.12)] text-white dark:text-[#1de9b6] shadow-sm' 
                          : 'text-slate-500 dark:text-[#6b7a99] hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      Minutes
                    </button>
                    <button
                      onClick={() => setUnit('hours')}
                      className={`flex-1 py-2 text-[13px] font-bold rounded-[10px] transition-all ${
                        unit === 'hours' 
                          ? 'bg-teal-600 dark:bg-[rgba(29,233,182,0.12)] text-white dark:text-[#1de9b6] shadow-sm' 
                          : 'text-slate-500 dark:text-[#6b7a99] hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      Hours
                    </button>
                  </div>
                </div>
              )}

              {activityType === 'numb' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-450 dark:text-[#6b7a99] uppercase tracking-wider">Unit</label>
                  <div className="flex bg-slate-50 dark:bg-[rgba(255,255,255,0.02)] border border-slate-200 dark:border-[rgba(255,255,255,0.06)] rounded-[14px] p-1">
                    <button
                      onClick={() => setUnit('rounds')}
                      className={`flex-1 py-2 text-[13px] font-bold rounded-[10px] transition-all ${
                        unit === 'rounds' 
                          ? 'bg-teal-600 dark:bg-[rgba(29,233,182,0.12)] text-white dark:text-[#1de9b6] shadow-sm' 
                          : 'text-slate-500 dark:text-[#6b7a99] hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      Rounds
                    </button>
                    <button
                      onClick={() => setUnit('page')}
                      className={`flex-1 py-2 text-[13px] font-bold rounded-[10px] transition-all ${
                        unit === 'page' 
                          ? 'bg-teal-600 dark:bg-[rgba(29,233,182,0.12)] text-white dark:text-[#1de9b6] shadow-sm' 
                          : 'text-slate-500 dark:text-[#6b7a99] hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      Pages
                    </button>
                  </div>
                </div>
              )}

              {/* Target Input */}
              {activityType !== 'yes_no' && (
                <div className="space-y-1.5 mb-2">
                  <label className="text-[11px] font-bold text-gray-450 dark:text-[#6b7a99] uppercase tracking-wider">Target</label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow flex items-center">
                      <span className="absolute left-4 text-slate-400 dark:text-[#6b7a99]">
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                      </span>
                      <input
                        key={activityType + '-' + unit}
                        type={activityType === 'time' ? 'time' : 'number'}
                        min="0"
                        placeholder={
                          activityType === 'numb' ? `Enter target ${unit}` :
                          activityType === 'min' ? `Enter target duration (${unit})` :
                          activityType === 'time' ? '05:00' :
                          'Enter target'
                        }
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#112240] text-gray-800 dark:text-white font-medium text-[14px] rounded-[14px] py-3.5 pl-11 pr-4 outline-none border border-slate-200 dark:border-[rgba(255,255,255,0.1)] focus:border-teal-500 dark:focus:border-[#1de9b6] placeholder-slate-400 dark:placeholder-[rgba(255,255,255,0.3)] transition-all font-mono"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-[rgba(255,255,255,0.06)]">
                <button 
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-[rgba(255,255,255,0.05)] text-gray-700 dark:text-white text-[14px] font-semibold rounded-[12px] dark:hover:bg-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSubmitting || !name.trim()}
                  className="flex-[1.5] py-3.5 bg-teal-500 hover:bg-teal-600 dark:bg-[#1de9b6] text-white dark:text-[#042C53] text-[14px] font-semibold rounded-[12px] dark:hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/10 dark:shadow-[#1de9b6]/20 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-[2px] border-white dark:border-[#042C53] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Save Activity"
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateNewActivity;
