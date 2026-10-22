import React from 'react';

/**
 * A round progress ring with text in the middle.
 * segments: [{ value, color }] drawn one after the other; `max` is the full circle.
 */
const Ring = ({ segments, max, size = 96, stroke = 10, children, track = '#e5e7eb' }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const full = Math.max(max || 0, 1);
  const shown = segments.filter((x) => x.value > 0).map((x) => ({ ...x, len: Math.min(x.value / full, 1) * c }));
  const starts = shown.map((_, i) => shown.slice(0, i).reduce((n, x) => n + x.len, 0));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {shown.map((x, i) => (
          <circle
            key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={x.color} strokeWidth={stroke}
            strokeDasharray={`${x.len} ${c - x.len}`} strokeDashoffset={-starts[i]}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">{children}</div>
    </div>
  );
};

export default Ring;
