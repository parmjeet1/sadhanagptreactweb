import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequest, postRequest } from '../../services/api';
import { processResponse } from '../../utils/apiUtils';

const SubGroupModal = ({ isOpen, onClose, userDetails, centerId, groupName, onLabelsUpdated }) => {
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && centerId) {
      fetchLabels();
    }
  }, [isOpen, centerId]);

  const fetchLabels = () => {
    setIsLoading(true);
    getRequest('/lable-list', { user_id: userDetails.user_id, center_id: centerId }, (response) => {
      setIsLoading(false);
      const res = response.data;
      if (res && res.code === 200 && Array.isArray(res.data)) {
        setLabels(res.data);
      }
    });
  };

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;
    
    const payload = {
      user_id: userDetails.user_id,
      center_id: centerId,
      lable_name: newLabelName.trim()
    };
    
    const addedName = newLabelName.trim();
    
    postRequest('/add-lable', payload, (response) => {
      const resData = response.data;
      if (resData?.code === 200) {
        setNewLabelName('');
        // Optimistically add to UI immediately
        if (resData.data && resData.data.label_id) {
          setLabels(prev => [...prev, { label_id: resData.data.label_id, label_name: addedName }]);
        } else {
          fetchLabels(); // fallback
        }
        if (onLabelsUpdated) onLabelsUpdated();
      } else {
        const resMessage = processResponse(resData);
        setErrorMsg(resMessage?.message || 'Failed to add sub-group');
        setTimeout(() => setErrorMsg(''), 3000);
      }
    });
  };

  const handleEditLabel = (id, name) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveEdit = () => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }

    const payload = {
      user_id: userDetails.user_id,
      label_id: editingId,
      lable_name: editingName.trim()
    };

    postRequest('/edit-lable', payload, (response) => {
      const resData = response.data;
      if (resData?.code === 200) {
        setEditingId(null);
        // Optimistically update local array
        setLabels(prev => prev.map(l => l.label_id === editingId ? { ...l, label_name: editingName.trim() } : l));
        if (onLabelsUpdated) onLabelsUpdated();
      } else {
        const resMessage = processResponse(resData);
        setErrorMsg(resMessage?.message || 'Failed to edit sub-group');
        setTimeout(() => setErrorMsg(''), 3000);
      }
    });
  };

  const handleDeleteLabel = (labelId) => {
    if (!window.confirm("Are you sure you want to delete this sub-group?")) return;

    const payload = {
      label_id: labelId
    };

    postRequest('/delete-lable', payload, (response) => {
      const resData = response.data;
      if (resData?.code === 200) {
        // Optimistically remove from local array
        setLabels(prev => prev.filter(l => l.label_id !== labelId));
        if (onLabelsUpdated) onLabelsUpdated();
      } else {
        const resMessage = processResponse(resData);
        setErrorMsg(resMessage?.message || 'Failed to delete sub-group');
        setTimeout(() => setErrorMsg(''), 3000);
      }
    });
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

          {/* Bottom Sheet */}
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
            {/* Drag Handle */}
            <div className="w-full pt-4 pb-2 flex justify-center sticky top-0 bg-white rounded-t-[32px] z-10">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
            </div>

            <div className="px-6 pb-8 pt-2 max-h-[85vh] overflow-y-auto hide-scrollbar flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-[24px] font-extrabold text-[#0f172a]">Mentee Sub Groups</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
          {errorMsg && (
            <div className="mb-4 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold text-center">
              {errorMsg}
            </div>
          )}

          {/* Group Selector (Locked since we are inside a specific group view) */}
          <div className="mb-6">
            <label className="text-[11px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Select Group</label>
            <div className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-500 flex items-center justify-between">
              <span>{groupName || 'Current Group'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Available Labels */}
          <div>
            <label className="text-[11px] font-black uppercase text-gray-400 mb-3 block tracking-widest">Available Sub Groups</label>
            
            {isLoading ? (
              <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <div className="space-y-2 mb-4">
                {labels.length === 0 ? (
                  <p className="text-sm text-gray-400 font-medium italic text-center py-2">No sub-groups exist yet.</p>
                ) : (
                  labels.map((lbl) => (
                    <div key={lbl.label_id} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      {editingId === lbl.label_id ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input 
                            type="text" 
                            value={editingName} 
                            onChange={(e) => setEditingName(e.target.value)} 
                            className="flex-1 bg-gray-50 px-3 py-1.5 rounded-xl text-sm font-bold outline-none border border-blue-200"
                            autoFocus
                          />
                          <button onClick={handleSaveEdit} className="p-1.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                      ) : (
                        <>
                          <span className="font-bold text-[#0f172a] text-sm pl-2">{lbl.label_name}</span>
                          <div className="flex gap-1">
                            <button onClick={() => handleEditLabel(lbl.label_id, lbl.label_name)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => handleDeleteLabel(lbl.label_id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Add Custom Label */}
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="text" 
                placeholder="Add custom sub group..." 
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddLabel(); }}
                className="flex-1 bg-[#f8fafc] rounded-2xl py-4 px-5 text-[15px] font-medium outline-none border border-transparent focus:border-blue-200 transition-all"
              />
              <button 
                onClick={handleAddLabel}
                disabled={!newLabelName.trim()}
                className="w-[56px] h-[56px] bg-[#1a73e8] text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
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

export default SubGroupModal;
