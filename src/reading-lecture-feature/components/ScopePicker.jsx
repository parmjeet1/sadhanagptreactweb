import React from 'react';
import { inputCls } from './ui';

/** Choose All groups / one group / one sub-group. groups = [{ id, name, subgroups: [{ id, name }] }] */
const ScopePicker = ({ scope, onChange, groups = [] }) => {
  const group = groups.find((g) => g.id === scope.groupId);
  return (
    <div className="grid grid-cols-2 gap-3">
      <select
        className={`${inputCls} !py-2.5 !px-3 !text-[13px]`}
        value={scope.groupId}
        onChange={(e) => onChange({ groupId: e.target.value, subId: 'all' })}
        aria-label="Group"
      >
        <option value="all">All groups</option>
        {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
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
