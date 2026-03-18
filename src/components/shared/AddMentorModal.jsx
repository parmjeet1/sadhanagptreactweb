import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AddMentorModal = ({ isOpen, onClose, onAdd }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleAdd = () => {
    if (searchQuery.trim()) {
      onAdd(searchQuery);
      setSearchQuery('');
    }
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[101] flex justify-center"
          >
            <div className="w-full max-w-md bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl">
              {/* Drag Handle / Close Touch Area */}
              <div 
                onClick={onClose}
                className="w-full flex justify-center mb-8 cursor-pointer group"
              >
                <div className="w-12 h-1.5 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors" />
              </div>

              <h2 className="text-[24px] font-black text-[#0f172a] mb-2 tracking-tight">Add Mentor</h2>
              <p className="text-[14px] font-medium text-gray-400 mb-8 tracking-tight leading-relaxed">
                Enter the name or email address of the mentor you'd like to connect with.
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Search Mentor</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Name or email address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#f8fafc] text-[#0f172a] font-bold text-[16px] rounded-2xl py-4 px-6 outline-none border-2 border-transparent focus:border-[#fef3c7] focus:bg-white transition-all placeholder:text-gray-300"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl bg-gray-50 text-[#94a3b8] font-black text-[15px] hover:bg-gray-100 transition-all uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!searchQuery.trim()}
                    className="flex-[2] py-4 rounded-2xl bg-[#f97316] text-white font-black text-[15px] shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-widest"
                  >
                    Add Mentor
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddMentorModal;
