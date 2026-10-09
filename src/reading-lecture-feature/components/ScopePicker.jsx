import React from 'react';
import { MOCK_GROUPS } from '../data/mockCounsellor';
import { inputCls } from './ui';

/** Choose All groups / one group / one sub-group. */
const ScopePicker = ({ scope, onChange }) => {
  const group = MOCK_GROUPS.find((g) => g.id === scope.groupId);
  return (
    <div className="grid grid-cols-2 gap-3">
      <select
        className={`${inputCls} !py-2.5 !px-3 !text-[13px]`}
        value={scope.groupId}
        onChange={(e) => onChange({ groupId: e.target.value, subId: 'all' })}
        aria-label="Group"
      >
        <option value="all">All groups</option>
        {MOCK_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <select
        className={`${inputCls} !py-2.5 !px-3 !text-[13px] disabled:bg-gray-50 disabled:text-gray-300`}
        value={scope.subId}
        disabled={!group}
        onChange={(e) => onChange({ ...scope, subId: e.target.value })}
        aria-label="Sub-group"
      >
        <option value="all">All sub-groups</option>
        {group?.subgroups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  );
};

export default ScopePicker;
