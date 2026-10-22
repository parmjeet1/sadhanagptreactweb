import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRequest, postRequest, deleteRequest } from '../../services/api';

// "Assign Group" window for ONE or MORE mentees - the same screen and the same server calls as the
// Assign Group window of the Mentees / Group Management page:
//   GET /group-list, GET /lable-list, POST /assign-student-center-label, POST /add-new-group, POST /add-lable
// plus "Manage Groups" / "Manage Subgroups" (rename, delete, add): POST /edit-center, DELETE /delete-center,
//   POST /add-lable, POST /edit-lable, POST /delete-lable
// props: open, onClose(), userId, studentIds[], title, currentGroupName?, currentSubgroupName? (used to pre-select),
//        onAssigned(message) (called after a successful save), onChanged() (called after a group / subgroup was
//        renamed or deleted, so the screen behind can reload its names)

const Radio = ({ on }) => (
  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-blue-600' : 'border-gray-300'}`}>
    {on && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
  </span>
);

const Tick = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
const Cross = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>;
const Plus = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>;

const Pencil = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const Trash = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const ConfirmDialog = ({ isOpen, title, message, confirmLabel, onConfirm, onCancel }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={onCancel} />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center">
          <h3 className="text-xl font-extrabold text-[#0f172a] mb-2">{title}</h3>
          <p className="text-gray-500 text-sm font-medium mb-6 leading-relaxed whitespace-pre-line">{message}</p>
          <div className="flex flex-col gap-3">
            <button onClick={onConfirm} className="w-full bg-red-500 text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-all">{confirmLabel}</button>
            <button onClick={onCancel} className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl active:scale-95 transition-all">Cancel</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const messageOf = (data, fallback) => (Array.isArray(data?.message) ? data.message[0] : data?.message) || fallback;

const AssignGroupSheet = ({ open, onClose, userId, studentIds, title, currentGroupName, currentSubgroupName, onAssigned, onChanged }) => {
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

  // Manage Groups / Manage Subgroups
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false);
  const [editGroupTarget, setEditGroupTarget] = useState(null); // { id, name }
  const [deleteGroupTarget, setDeleteGroupTarget] = useState(null);
  const [manageLabelsOpen, setManageLabelsOpen] = useState(false);
  const [labelsForManage, setLabelsForManage] = useState([]);
  const [newManageLabel, setNewManageLabel] = useState('');
  const [editLabelTarget, setEditLabelTarget] = useState(null); // { label_id, label_name }
  const [editLabelDraft, setEditLabelDraft] = useState('');
  const [deleteLabelTarget, setDeleteLabelTarget] = useState(null);

  // the mentee's current names are only read when the window opens (a later rename must not reset the choice)
  const currentNames = useRef({ group: currentGroupName, label: currentSubgroupName });
  useEffect(() => { currentNames.current = { group: currentGroupName, label: currentSubgroupName }; }, [currentGroupName, currentSubgroupName]);

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
    setManageGroupsOpen(false); setManageLabelsOpen(false);
    getRequest('/group-list', { user_id: userId, page_no: 1 }, (response) => {
      const res = response?.data;
      if (res?.code === 200 && Array.isArray(res.data)) {
        setCenters(res.data);
        const wanted = currentNames.current;
        const current = wanted.group ? res.data.find((c) => c.name === wanted.group) : null;
        if (current) {
          setGroup(current.center_id);
          loadLabels(current.center_id, wanted.label);
        }
      }
    });
  }, [open, userId, loadLabels]);

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

  const reloadCenters = () => {
    getRequest('/group-list', { user_id: userId, page_no: 1 }, (r) => {
      if (r?.data?.code === 200 && Array.isArray(r.data.data)) setCenters(r.data.data);
    });
  };

  const submitEditGroup = () => {
    const name = editGroupTarget?.name?.trim();
    if (!name) { setError('Group name cannot be empty'); return; }
    postRequest('/edit-center', { user_id: userId, center_id: editGroupTarget.id, name }, (response) => {
      const data = response?.data;
      if (data?.code === 200 || data?.status === 1) {
        setEditGroupTarget(null);
        setError('');
        reloadCenters();
        onChanged?.();
      } else {
        setError(messageOf(data, 'Failed to update group'));
      }
    });
  };

  const submitDeleteGroup = () => {
    if (!deleteGroupTarget) return;
    deleteRequest('/delete-center', { user_id: userId, center_id: deleteGroupTarget.id }, (response) => {
      const data = response?.data;
      if (data?.code === 200 || data?.status === 1) {
        if (group === deleteGroupTarget.id) { setGroup(''); setLabel(''); setLabels([]); }
        setDeleteGroupTarget(null);
        setError('');
        reloadCenters();
        onChanged?.();
      } else {
        setDeleteGroupTarget(null);
        setError(messageOf(data, 'Failed to delete group'));
      }
    });
  };

  const openManageLabels = () => {
    if (!group) { setError('Select a group first to manage its subgroups'); return; }
    setManageLabelsOpen(true);
    reloadManageLabels(group);
  };
  const reloadManageLabels = (centerId) => {
    getRequest('/lable-list', { user_id: userId, center_id: centerId }, (response) => {
      const res = response?.data;
      if (res?.code === 200 && Array.isArray(res.data)) setLabelsForManage(res.data);
    });
    loadLabels(centerId);
  };

  const addLabelInManage = () => {
    const name = newManageLabel.trim();
    if (!name) return;
    postRequest('/add-lable', { user_id: userId, center_id: group, lable_name: name }, (response) => {
      const data = response?.data;
      if (data?.code === 200) { setNewManageLabel(''); reloadManageLabels(group); }
      else setError(messageOf(data, 'Failed to add sub-group'));
    });
  };

  const submitEditLabel = () => {
    const name = editLabelDraft.trim();
    if (!name) { setEditLabelTarget(null); return; }
    postRequest('/edit-lable', { user_id: userId, label_id: editLabelTarget.label_id, lable_name: name }, (response) => {
      const data = response?.data;
      if (data?.code === 200) { setEditLabelTarget(null); reloadManageLabels(group); onChanged?.(); }
      else setError(messageOf(data, 'Failed to rename sub-group'));
    });
  };

  const submitDeleteLabel = () => {
    if (!deleteLabelTarget) return;
    postRequest('/delete-lable', { user_id: userId, label_id: deleteLabelTarget.label_id }, (response) => {
      const data = response?.data;
      if (data?.code === 200) {
        if (label === deleteLabelTarget.label_id) setLabel('');
        setDeleteLabelTarget(null);
        reloadManageLabels(group);
        onChanged?.();
      } else {
        setDeleteLabelTarget(null);
        setError(messageOf(data, 'Failed to delete sub-group'));
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
              <div className="mb-3 flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Select Group</label>
                <button onClick={() => setManageGroupsOpen(true)} className="text-[11px] font-bold text-blue-600">Manage Groups</button>
              </div>
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

              <div className="mb-3 flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Select Subgroup</label>
                <button onClick={openManageLabels} disabled={!group} className="text-[11px] font-bold text-blue-600 disabled:opacity-40">Manage Subgroups</button>
              </div>
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

      {open && manageGroupsOpen && (
        <motion.div key="manage-groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setManageGroupsOpen(false)} className="fixed inset-0 z-[75] bg-black/40 backdrop-blur-sm flex items-end justify-center">
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md p-8 rounded-t-[40px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-6">Manage Groups</h2>
            <div className="space-y-2">
              {centers.length === 0 ? (
                <p className="text-sm text-gray-400 font-medium italic text-center py-4">No groups created yet.</p>
              ) : centers.map((c) => (
                <div key={c.center_id} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                  <span className="font-bold text-[#0f172a] text-sm">{c.name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setEditGroupTarget({ id: c.center_id, name: c.name })} aria-label={`Rename ${c.name}`} className="p-2 text-gray-400 hover:text-blue-500"><Pencil /></button>
                    <button onClick={() => setDeleteGroupTarget({ id: c.center_id, name: c.name })} aria-label={`Delete ${c.name}`} className="p-2 text-gray-400 hover:text-red-500"><Trash /></button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setManageGroupsOpen(false)} className="w-full mt-6 py-4 text-gray-400 font-bold">Close</button>
          </motion.div>
        </motion.div>
      )}

      {open && editGroupTarget && (
        <motion.div key="edit-group" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => setEditGroupTarget(null)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md p-8 rounded-t-[40px]">
            <h2 className="text-xl font-black mb-6">Rename Group</h2>
            <input type="text" value={editGroupTarget.name} onChange={(e) => setEditGroupTarget({ ...editGroupTarget, name: e.target.value })} className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none border border-transparent focus:border-blue-200 mb-6" autoFocus />
            <button onClick={submitEditGroup} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl mb-3">Save Changes</button>
            <button onClick={() => setEditGroupTarget(null)} className="w-full py-3 text-gray-400 font-bold">Cancel</button>
          </motion.div>
        </motion.div>
      )}

      {open && manageLabelsOpen && (
        <motion.div key="manage-labels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setManageLabelsOpen(false)} className="fixed inset-0 z-[75] bg-black/40 backdrop-blur-sm flex items-end justify-center">
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md p-8 rounded-t-[40px] max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-black mb-1">Manage Subgroups</h2>
            <p className="text-gray-400 font-bold text-[13px] mb-5">{groupName}</p>
            <div className="space-y-2 mb-4">
              {labelsForManage.length === 0 ? (
                <p className="text-sm text-gray-400 font-medium italic text-center py-2">No subgroups exist yet.</p>
              ) : labelsForManage.map((l) => (
                <div key={l.label_id} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                  <span className="font-bold text-[#0f172a] text-sm">{l.label_name}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditLabelTarget(l); setEditLabelDraft(l.label_name); }} aria-label={`Rename ${l.label_name}`} className="p-2 text-gray-400 hover:text-blue-500"><Pencil /></button>
                    <button onClick={() => setDeleteLabelTarget(l)} aria-label={`Delete ${l.label_name}`} className="p-2 text-gray-400 hover:text-red-500"><Trash /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-6">
              <input type="text" placeholder="Add subgroup..." value={newManageLabel} onChange={(e) => setNewManageLabel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addLabelInManage(); }} className="flex-1 bg-gray-50 rounded-2xl py-4 px-5 text-[14px] font-medium outline-none border border-transparent focus:border-blue-200" />
              <button onClick={addLabelInManage} disabled={!newManageLabel.trim()} aria-label="Add subgroup" className="w-[50px] h-[50px] bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-50"><Plus /></button>
            </div>
            <button onClick={() => setManageLabelsOpen(false)} className="w-full py-4 text-gray-400 font-bold">Close</button>
          </motion.div>
        </motion.div>
      )}

      {open && editLabelTarget && (
        <motion.div key="edit-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md flex items-end justify-center" onClick={() => setEditLabelTarget(null)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md p-8 rounded-t-[40px]">
            <h2 className="text-xl font-black mb-6">Rename Subgroup</h2>
            <input type="text" value={editLabelDraft} onChange={(e) => setEditLabelDraft(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none border border-transparent focus:border-blue-200 mb-6" autoFocus />
            <button onClick={submitEditLabel} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl mb-3">Save Changes</button>
            <button onClick={() => setEditLabelTarget(null)} className="w-full py-3 text-gray-400 font-bold">Cancel</button>
          </motion.div>
        </motion.div>
      )}

      <ConfirmDialog
        key="confirm-delete-group"
        isOpen={open && !!deleteGroupTarget}
        title={`Delete '${deleteGroupTarget?.name}'?`}
        message={'All students currently assigned to this group will be moved to Uncategorised and their subgroup assignment will be cleared.\n\nTheir accounts and Sadhna records will NOT be deleted.\n\nThis action cannot be undone.'}
        confirmLabel="Delete Group"
        onConfirm={submitDeleteGroup}
        onCancel={() => setDeleteGroupTarget(null)}
      />
      <ConfirmDialog
        key="confirm-delete-label"
        isOpen={open && !!deleteLabelTarget}
        title={`Delete '${deleteLabelTarget?.label_name}'?`}
        message={'Students in this subgroup will NOT be deleted. Their Group stays unchanged, but their Subgroup will be cleared to Uncategorised.\n\nThis action cannot be undone.'}
        confirmLabel="Delete Subgroup"
        onConfirm={submitDeleteLabel}
        onCancel={() => setDeleteLabelTarget(null)}
      />
    </AnimatePresence>
  );
};

export default AssignGroupSheet;
