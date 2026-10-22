import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequest, postRequest } from '../../services/api';

// "Assign Group" window for ONE or MORE mentees - the same screen and the same server calls as the
// Assign Group window of the Mentees / Group Management page:
//   GET /group-list, GET /lable-list, POST /assign-student-center-label, POST /add-new-group, POST /add-lable
// props: open, onClose(), userId, studentIds[], title, currentGroupName?, currentSubgroupName? (used to pre-select),
//        onAssigned() (called after a successful save)

const Radio = ({ on }) => (
  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-blue-600' : 'border-gray-300'}`}>
    {on && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
  </span>
);

const Tick = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
const Cross = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>;
const Plus = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>;

const messageOf = (data, fallback) => (Array.isArray(data?.message) ? data.message[0] : data?.message) || fallback;

const AssignGroupSheet = ({ open, onClose, userId, studentIds, title, currentGroupName, currentSubgroupName, onAssigned }) => {
  const [centers, setCenters] = useState([]);
  const [labels, setLabels] = useState([]);
  const [group, setGroup] = useState('');
  const [label, setLabel] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [labelSearch, setLabelSearch] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadLabels = useCallback((centerId, wantedName) => {
    if (!centerId) { setLabels([]); return; }
    getRequest('/lable-list', { user_id: userId, center_id: centerId }, (response) => {
      const res = response?.data;
      if (res?.code === 200 && Array.isArray(res.data)) {
        const list = res.data.map((l) => ({ id: l.label_id, name: l.label_name }));
        setLabels(list);
        if (wantedName) {
          const found = list.find((l) => l.name === wantedName);
          if (found) setLabel(found.id);
        }
      }
    });
  }, [userId]);

  // Each time the window opens: start clean, load the groups, and pre-select the mentee's current group / subgroup
  useEffect(() => {
    if (!open) return;
    setGroup(''); setLabel(''); setLabels([]);
    setGroupSearch(''); setLabelSearch('');
    setCreatingGroup(false); setNewGroupName(''); setCreatingLabel(false); setNewLabelName('');
    setError(''); setSaving(false);
    getRequest('/group-list', { user_id: userId, page_no: 1 }, (response) => {
      const res = response?.data;
      if (res?.code === 200 && Array.isArray(res.data)) {
        setCenters(res.data);
        const current = currentGroupName ? res.data.find((c) => c.name === currentGroupName) : null;
        if (current) {
          setGroup(current.center_id);
          loadLabels(current.center_id, currentSubgroupName);
        }
      }
    });
  }, [open, userId, currentGroupName, currentSubgroupName, loadLabels]);

  const pickGroup = (centerId) => {
    setGroup(centerId);
    setLabel('');
    setLabelSearch('');
    loadLabels(centerId);
  };

  const createGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    postRequest('/add-new-group', { user_id: userId, name, city: '' }, (response) => {
      const data = response?.data;
      if (data?.status === 1 || data?.code === 200) {
        const newId = data?.data?.center_id || data?.data?.id;
        setNewGroupName('');
        setCreatingGroup(false);
        getRequest('/group-list', { user_id: userId, page_no: 1 }, (r) => {
          if (r?.data?.code === 200 && Array.isArray(r.data.data)) setCenters(r.data.data);
        });
        if (newId) pickGroup(newId);
      } else {
        setError(messageOf(data, 'Failed to create group'));
      }
    });
  };

  const createLabel = () => {
    const name = newLabelName.trim();
    if (!name || !group) return;
    postRequest('/add-lable', { user_id: userId, center_id: group, lable_name: name }, (response) => {
      const data = response?.data;
      if (data?.code === 200) {
        setNewLabelName('');
        setCreatingLabel(false);
        loadLabels(group);
        if (data.data?.label_id) setLabel(data.data.label_id);
      } else {
        setError(messageOf(data, 'Failed to create subgroup'));
      }
    });
  };

  const save = () => {
    if (!group) { setError('Select a group for assignment'); return; }
    setSaving(true);
    setError('');
    postRequest('/assign-student-center-label', { user_id: userId, student_ids: studentIds, center_id: group, label_id: label }, (res) => {
      setSaving(false);
      const data = res?.data;
      if (data?.status === 1) {
        onAssigned?.(messageOf(data, 'Students assigned successfully'));
        onClose?.();
      } else {
        setError(messageOf(data, 'Failed to assign students'));
      }
    });
  };

  const shownGroups = centers.filter((c) => c.name.toLowerCase().includes(groupSearch.trim().toLowerCase()));
  const shownLabels = labels.filter((l) => l.name.toLowerCase().includes(labelSearch.trim().toLowerCase()));
  const groupName = centers.find((c) => c.center_id === group)?.name || '';
  const count = studentIds.length;

  const inlineCreate = (value, setValue, onSave, onCancel, placeholder) => (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="text"
        autoFocus
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
        className="flex-1 bg-blue-50 rounded-2xl py-3.5 px-4 text-[14px] font-bold outline-none border border-blue-200"
      />
      <button onClick={onSave} disabled={!value.trim()} aria-label="Create" className="p-3.5 bg-blue-600 text-white rounded-2xl disabled:opacity-40 shrink-0"><Tick /></button>
      <button onClick={onCancel} aria-label="Cancel" className="p-3.5 bg-gray-100 text-gray-500 rounded-2xl shrink-0"><Cross /></button>
    </div>
  );

  const dashedBtn = (text, onClick, extra = '') => (
    <button onClick={onClick} className={`w-full flex items-center justify-center gap-2 py-3.5 mt-1 rounded-2xl border-2 border-dashed border-blue-200 text-blue-600 font-bold text-[13px] hover:bg-blue-50 transition-all ${extra}`}>
      <Plus />{text}
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={onClose}>
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-t-[32px] flex flex-col"
            style={{ height: '80vh' }}
          >
            <div className="w-full pt-4 pb-2 flex justify-center shrink-0"><div className="w-12 h-1.5 bg-gray-200 rounded-full" /></div>
            <div className="flex items-center justify-between px-6 pb-4 shrink-0 border-b border-gray-50">
              <h2 className="text-xl font-black text-[#0f172a] truncate pr-3">{title || `Assign ${count} Student${count !== 1 ? 's' : ''}`}</h2>
              <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 shrink-0"><Cross /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <label className="block mb-3 text-[11px] font-black uppercase text-gray-400 tracking-widest">Select Group</label>
              <input
                type="text"
                placeholder="Search or select group..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="w-full bg-gray-50 rounded-2xl py-3.5 px-4 mb-3 text-[14px] font-medium outline-none border border-transparent focus:border-blue-200"
              />
              <div className="space-y-1.5 mb-2">
                {shownGroups.length === 0 ? (
                  <p className="text-sm text-gray-400 font-medium italic text-center py-3">No groups match.</p>
                ) : shownGroups.map((c) => (
                  <button key={c.center_id} onClick={() => pickGroup(c.center_id)} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${group === c.center_id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                    <Radio on={group === c.center_id} />
                    <span className="font-bold text-[#0f172a] text-[14px] truncate">{c.name}</span>
                  </button>
                ))}
              </div>
              {creatingGroup
                ? <div className="mb-6">{inlineCreate(newGroupName, setNewGroupName, createGroup, () => { setCreatingGroup(false); setNewGroupName(''); }, 'New group name...')}</div>
                : dashedBtn('Create New Group', () => setCreatingGroup(true), 'mb-6')}

              <label className="block mb-3 text-[11px] font-black uppercase text-gray-400 tracking-widest">Select Subgroup</label>
              {!group ? (
                <p className="text-sm text-gray-400 font-medium italic text-center py-4 bg-gray-50 rounded-2xl">Select a group first</p>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search or select subgroup..."
                    value={labelSearch}
                    onChange={(e) => setLabelSearch(e.target.value)}
                    className="w-full bg-gray-50 rounded-2xl py-3.5 px-4 mb-3 text-[14px] font-medium outline-none border border-transparent focus:border-blue-200"
                  />
                  <div className="space-y-1.5 mb-2">
                    {shownLabels.length === 0 ? (
                      <p className="text-sm text-gray-400 font-medium italic text-center py-3">No subgroups match.</p>
                    ) : shownLabels.map((l) => (
                      <button key={l.id} onClick={() => setLabel(l.id)} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${label === l.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                        <Radio on={label === l.id} />
                        <span className="font-bold text-[#0f172a] text-[14px] truncate">{l.name}</span>
                      </button>
                    ))}
                  </div>
                  {creatingLabel
                    ? inlineCreate(newLabelName, setNewLabelName, createLabel, () => { setCreatingLabel(false); setNewLabelName(''); }, 'New subgroup name...')
                    : dashedBtn('Create New Subgroup', () => setCreatingLabel(true))}
                </>
              )}
            </div>

            <div className="px-6 pt-3 pb-6 shrink-0 border-t border-gray-50 bg-white">
              {error && <p className="text-[13px] font-semibold text-red-500 mb-2">{error}</p>}
              <button onClick={save} disabled={!group || saving} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl disabled:opacity-40 active:scale-[0.98] transition-all">
                {saving ? 'Saving...' : (groupName ? `Save: ${groupName}` : 'Save')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AssignGroupSheet;
