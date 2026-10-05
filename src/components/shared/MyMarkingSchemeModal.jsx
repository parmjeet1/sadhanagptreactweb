import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { getSchemes, createScheme, deleteScheme, chooseMyScheme } from '../../api/markingSchemes';
import { getRequest } from '../../services/api';

/**
 * Small "My Marking Scheme" window (opened from the marks circle) for students AND counsellors.
 * Lists the person's own schemes, lets them use one for themselves, edit / delete it, or make a new one
 * ("Make for Self"). Kept compact on purpose: it is a bottom sheet on phones (max 75% of the screen
 * height, scrolls inside) and a small centred box on bigger screens.
 */
const MyMarkingSchemeModal = ({ onClose }) => {
  const navigate = useNavigate();
  const userDetails = (() => { try { return JSON.parse(localStorage.getItem('user_details') || '{}'); } catch { return {}; } })();
  const isCounsellor = userDetails.user_type === 'counsellor';

  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState([]);          // my own schemes only
  const [personalId, setPersonalId] = useState(null);  // the one I use for myself
  const [applied, setApplied] = useState(null);        // what is actually applied to me right now
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [newName, setNewName] = useState('');
  const [makeForSelf, setMakeForSelf] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getSchemes(true);
      const mine = (res.schemes || []).filter(s => !s.isSystemDefault && String(s.counsellor_id) === String(userDetails.user_id));
      setSchemes(mine);
      setPersonalId(res.personalSchemeId ?? null);
    } catch {
      setError('Could not load your schemes.');
    }
    getRequest('/applied-marking-scheme', { user_id: userDetails.user_id }, (response) => {
      if (response?.data?.code === 200) setApplied(response.data.data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const editorPath = (id) => (isCounsellor ? `/counsellor/marking-scheme/${id}` : `/student/marking-scheme/${id}`);

  const flash = (msg, isError = false) => {
    setError(isError ? msg : '');
    setMessage(isError ? '' : msg);
  };

  const handleUse = async (id) => {
    setBusyId(id);
    try {
      const res = await chooseMyScheme(id);
      flash(res.message || 'Saved.');
      await load();
    } catch (e) {
      flash(e.message, true);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteScheme(id);
      setConfirmDeleteId(null);
      flash('Scheme deleted.');
      await load();
    } catch (e) {
      flash(e.message, true);
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || creating) return;
    if (schemes.some(s => s.name.trim().toLowerCase() === name.toLowerCase())) {
      flash('You already have a scheme with this name.', true);
      return;
    }
    setCreating(true);
    try {
      const res = await createScheme(name, [], makeForSelf);
      const id = res?.scheme?.id;
      onClose();
      if (id) navigate(editorPath(id)); // straight into the editor to fill in the rules
    } catch (e) {
      flash(e.message, true);
      setCreating(false);
    }
  };

  const sourceText = applied
    ? ({ subgroup: "your counsellor's sub-group scheme", group: "your counsellor's group scheme", personal: 'your own scheme', default: 'the default scheme' }[applied.applied_source] || '')
    : '';

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:px-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-[360px] max-h-[75vh] bg-white dark:bg-[#112240] rounded-t-[20px] sm:rounded-[20px] shadow-2xl border border-slate-100 dark:border-[rgba(255,255,255,0.08)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-slate-100 dark:border-[rgba(255,255,255,0.08)] shrink-0">
          <h2 className="text-[14px] font-bold text-[#0f172a] dark:text-white">My Marking Scheme</h2>
          <button onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-[rgba(255,255,255,0.08)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 space-y-3 text-[12px]">
          {/* What is in use now */}
          {loading ? (
            <p className="text-slate-500 dark:text-[#6b7a99]">Loading…</p>
          ) : applied && (
            <div className="rounded-[10px] bg-slate-50 dark:bg-[#0b1628] border border-slate-100 dark:border-[rgba(255,255,255,0.06)] p-2.5 leading-snug">
              <p className="text-slate-600 dark:text-slate-300">
                In use now: <span className="font-bold text-slate-900 dark:text-white">{applied.scheme_name}</span>
                {sourceText && <span className="text-slate-500 dark:text-[#6b7a99]"> ({sourceText})</span>}
              </p>
              {applied.personal_overridden && (
                <p className="mt-1 text-amber-600 dark:text-amber-400">
                  Your own scheme “{applied.personal_scheme_name}” is saved but your counsellor’s scheme is used for now. Yours applies again if it is removed.
                </p>
              )}
            </div>
          )}

          {message && <p className="text-teal-700 dark:text-[#1de9b6] font-medium">{message}</p>}
          {error && <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>}

          {/* My schemes */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#6b7a99] mb-1.5">My schemes</p>
            {!loading && schemes.length === 0 && (
              <p className="text-slate-500 dark:text-[#6b7a99] italic">You have not made a scheme yet.</p>
            )}
            <div className="space-y-2">
              {schemes.map(s => {
                const inUse = Number(personalId) === Number(s.id);
                const busy = busyId === s.id;
                return (
                  <div key={s.id} className="rounded-[10px] border border-slate-200 dark:border-[rgba(255,255,255,0.08)] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-[13px] text-slate-800 dark:text-white truncate">{s.name}</p>
                      {inUse && <span className="shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-[rgba(29,233,182,0.15)] dark:text-[#1de9b6]">Using</span>}
                    </div>
                    {confirmDeleteId === s.id ? (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 flex-1">Delete this scheme and its rules?</span>
                        <button disabled={busy} onClick={() => handleDelete(s.id)} className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold disabled:opacity-50">Delete</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[rgba(255,255,255,0.08)] text-slate-700 dark:text-white text-[11px] font-semibold">No</button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          disabled={busy}
                          onClick={() => handleUse(inUse ? null : s.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold disabled:opacity-50 ${inUse ? 'bg-slate-100 dark:bg-[rgba(255,255,255,0.08)] text-slate-700 dark:text-white' : 'bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53]'}`}
                        >
                          {busy ? '…' : inUse ? 'Stop using' : 'Use for me'}
                        </button>
                        <button onClick={() => { onClose(); navigate(editorPath(s.id)); }} className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[rgba(255,255,255,0.12)] text-slate-700 dark:text-white text-[11px] font-semibold">Edit rules</button>
                        <button onClick={() => setConfirmDeleteId(s.id)} aria-label="Delete scheme" className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-[rgba(239,68,68,0.12)]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* New scheme */}
          <div className="rounded-[10px] bg-slate-50 dark:bg-[#0b1628] border border-slate-100 dark:border-[rgba(255,255,255,0.06)] p-2.5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#6b7a99]">New scheme</p>
            <input
              type="text"
              value={newName}
              maxLength={60}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="Scheme name"
              className="w-full bg-white dark:bg-[#112240] border border-slate-200 dark:border-[rgba(255,255,255,0.1)] rounded-[10px] px-2.5 py-2 text-[13px] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={makeForSelf} onChange={(e) => setMakeForSelf(e.target.checked)} className="w-4 h-4 mt-0.5 text-teal-600 rounded border-gray-300" />
              <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug"><span className="font-bold">Make for Self</span> – use it for my own marks</span>
            </label>
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="w-full py-2 rounded-[10px] bg-teal-500 dark:bg-[#1de9b6] text-white dark:text-[#042C53] text-[12px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating…' : 'Create and set rules'}
            </button>
            <p className="text-[10px] text-slate-500 dark:text-[#6b7a99] leading-snug">It starts as a copy of the default scheme; you can change every rule.</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MyMarkingSchemeModal;
