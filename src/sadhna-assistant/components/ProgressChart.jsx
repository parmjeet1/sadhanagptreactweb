import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * ProgressChart — a compact, dependency-free SVG line chart of the last N
 * days' marks, as returned by adapter.getLast7DaysMarks(). Renders only
 * data actually provided by the API; never invents missing values.
 */
export function ProgressChart({ data = [] }) {
  const { points, average, change, min, max } = useMemo(() => {
    if (!data.length) return { points: [], average: 0, change: 0, min: 0, max: 0 };
    const values = data.map((d) => d.marks);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    const change =
      values.length >= 2 ? values[values.length - 1] - values[values.length - 2] : 0;

    const W = 280;
    const H = 100;
    const pad = 12;
    const range = Math.max(1, max - min);
    const step = data.length > 1 ? (W - pad * 2) / (data.length - 1) : 0;

    const points = data.map((d, i) => {
      const x = pad + step * i;
      const y = H - pad - ((d.marks - min) / range) * (H - pad * 2);
      return { x, y, ...d };
    });

    return { points, average, change, min, max };
  }, [data]);

  if (!data.length) {
    return (
      <div className="text-sm text-saffron-700/70 py-4 text-center">
        No progress data available yet.
      </div>
    );
  }

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;

  const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const trendColor = change > 0 ? "text-leaf-500" : change < 0 ? "text-saffron-600" : "text-saffron-400";

  return (
    <div className="bg-white rounded-2xl border border-saffron-100 p-4">
      <svg viewBox="0 0 280 110" className="w-full h-28" role="img" aria-label="7-day Sadhna marks trend">
        <defs>
          <linearGradient id="sadhnaAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6993f" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#e6993f" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sadhnaAreaFill)" stroke="none" />
        <path d={pathD} fill="none" stroke="#c4651a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 3.4 : 2.4} fill="#c4651a" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center text-[11px] text-saffron-700/80 w-8">
            <span>{d.label}</span>
            <span className="font-medium text-saffron-900">{d.marks}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-saffron-100">
        <div className="text-sm text-saffron-800">
          7-day average: <span className="font-semibold">{average}</span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
          <TrendIcon size={15} />
          {change > 0 ? `+${change}` : change}
        </div>
      </div>
    </div>
  );
}

export default ProgressChart;
