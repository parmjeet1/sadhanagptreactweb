import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EditActivityModal = ({ isOpen, onClose, onSave, onDelete, activityToEdit }) => {
  const [name, setName] = useState('');
  const [trackingType, setTrackingType] = useState('Duration');

  // Pre-populate data when modal opens if editing an existing activity
  useEffect(() => {
    if (isOpen && activityToEdit) {
      setName(activityToEdit.title || '');
      // Example basic mapping (in real app, use enums)
      if (activityToEdit.type === 'COUNT') setTrackingType('Count');
      else if (activityToEdit.type === 'DURATION') setTrackingType('Duration');
      else if (activityToEdit.type === 'TIME') setTrackingType('Time');
      else if (activityToEdit.type === 'YES/NO') setTrackingType('Yes/No');
    }
  }, [isOpen, activityToEdit]);

  const trackingTypes = [
    {
      id: 'Count',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-[10px] tracking-wider mb-2">
          123
        </div>
      )
    },
    {
      id: 'Duration',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      )
    },
    {
      id: 'Time',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </div>
      ) 
    },
    {
      id: 'Yes/No',
      icon: (
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
      )
    }
  ];

  const handleSave = () => {
    if (!name.trim()) return;
    if (onSave) {
      onSave({
        ...activityToEdit,
        title: name,
        type: trackingType.toUpperCase(),
      });
    }
    onClose();
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
            className="fixed bottom-0 w-full max-w-md mx-auto bg-white rounded-t-[32px] shadow-2xl z-[90] flex flex-col"
            style={{
              left: 'auto',
              right: 'max(0px, calc(50% - 224px))'
            }}
          >
            {/* Drag Handle Area - Clickable to close as requested */}
            <div 
              className="w-full pt-4 pb-2 flex justify-center sticky top-0 bg-white rounded-t-[32px] z-10 cursor-pointer"
              onClick={onClose}
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
            </div>

            <div className="px-6 pb-8 pt-2 max-h-[85vh] overflow-y-auto hide-scrollbar flex flex-col h-full">
              
              <div className="flex-grow space-y-6">
                <h2 className="text-[24px] font-extrabold text-[#0f172a]">Edit Activity</h2>

                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Name</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Morning Yoga"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#f8fafc] text-[#0f172a] font-medium text-[15px] rounded-2xl py-4 pl-12 pr-4 outline-none border border-transparent focus:border-blue-100 placeholder-gray-400 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* Tracking Type Grid */}
                <div className="space-y-3">
                  <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Tracking Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {trackingTypes.map((type) => {
                      const isSelected = trackingType === type.id;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setTrackingType(type.id)}
                          className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
                            isSelected 
                              ? 'border-[#1a73e8] bg-[#f0f7ff]' 
                              : 'border-gray-100 bg-white hover:border-gray-200'
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
                          <span className={`text-[14px] font-bold ${isSelected ? 'text-[#0f172a]' : 'text-gray-500'}`}>
                            {type.id}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 pb-2">
                  <button 
                    onClick={onClose}
                    className="flex-1 py-4 text-[15px] font-bold text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex-[2] py-4 bg-[#1a73e8] hover:bg-[#155fc3] text-white text-[15px] font-bold rounded-full transition-all active:scale-[0.98] shadow-lg shadow-[#1a73e8]/30"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Bottom Delete Button */}
              <div className="w-full pt-4 mt-2 mb-2 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => {
                    if (onDelete) onDelete(activityToEdit?.id);
                    onClose();
                  }}
                  className="flex items-center gap-2 text-red-500 font-bold hover:text-red-600 transition-colors py-2 px-4 rounded-xl hover:bg-red-50"
                  aria-label="Delete Activity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Activity
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditActivityModal;
