import React from "react";

/**
 * A brief, gentle burst of small sparkles/petals used for the strongest
 * celebration moment (all Sadhna activities complete). Intentionally
 * restrained — a handful of soft gold/green dots, never loud confetti.
 * Runs once for ~1.6s and then removes itself from the render tree.
 */
export function SparkleBurst({ active, onDone }) {
  React.useEffect(() => {
    if (!active) return undefined;
    const t = setTimeout(() => onDone?.(), 1700);
    return () => clearTimeout(t);
  }, [active, onDone]);

  if (!active) return null;

  const dots = [
    { left: "18%", delay: "0ms", color: "#ecd18f" },
    { left: "32%", delay: "80ms", color: "#8fb672" },
    { left: "50%", delay: "40ms", color: "#e6993f" },
    { left: "66%", delay: "140ms", color: "#ecd18f" },
    { left: "80%", delay: "100ms", color: "#aecb92" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {dots.map((d, i) => (
        <span
          key={i}
          className="animate-sadhna-sparkle absolute top-1/2 h-2.5 w-2.5 rounded-full"
          style={{ left: d.left, backgroundColor: d.color, animationDelay: d.delay }}
        />
      ))}
    </div>
  );
}

export default SparkleBurst;
