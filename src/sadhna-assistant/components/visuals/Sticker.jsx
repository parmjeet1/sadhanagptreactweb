import React from "react";

/**
 * ============================================================================
 * Sticker — small, tasteful ISKCON-inspired illustrations.
 * ============================================================================
 *
 * Deliberately simple: soft saffron / cream / gold / light-green vector
 * shapes with a subtle floral accent, never cartoon-heavy. These render
 * inline as SVG so no image assets are needed and the module stays
 * self-contained.
 *
 * Usage: <Sticker name="japa_complete" size={48} animation="gentle_sparkle" />
 *
 * Unknown names fall back to a neutral flower/check mark so dynamically
 * added activities never break the visual layer.
 */

const ANIMATION_CLASS = {
  gentle_sparkle: "animate-sadhna-pop",
  gentle_glow: "animate-sadhna-glow",
  soft_pop: "animate-sadhna-pop",
  none: "",
};

function Wrapper({ children, size, animation, className = "" }) {
  const animClass = ANIMATION_CLASS[animation] || "";
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${animClass} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

const FloralAccent = ({ cx = 24, cy = 8 }) => (
  <g opacity="0.55">
    <circle cx={cx} cy={cy} r="2.1" fill="#8fb672" />
    <circle cx={cx + 3.5} cy={cy + 1.5} r="1.4" fill="#ecd18f" />
  </g>
);

const icons = {
  welcome: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <path
        d="M24 30c-5-3-9-7-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5-4 9-9 12Z"
        fill="#dd7f22"
        opacity="0.85"
      />
      <path d="M17 33c2.5 2 4.6 3 7 3s4.5-1 7-3" stroke="#c4651a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <FloralAccent cx="36" cy="12" />
    </svg>
  ),

  japa_beads: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <g stroke="#c4651a" strokeWidth="1.3" fill="#edb76f">
        <circle cx="24" cy="12" r="3" />
        <circle cx="33" cy="16" r="3" />
        <circle cx="36" cy="24" r="3" />
        <circle cx="33" cy="32" r="3" />
        <circle cx="24" cy="36" r="3" />
        <circle cx="15" cy="32" r="3" />
        <circle cx="12" cy="24" r="3" />
        <circle cx="15" cy="16" r="3" />
      </g>
      <circle cx="24" cy="24" r="4.2" fill="#c4651a" />
    </svg>
  ),

  japa_complete: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <g stroke="#a34d18" strokeWidth="1.3" fill="#ddb35a">
        <circle cx="24" cy="11" r="3" />
        <circle cx="34" cy="15.5" r="3" />
        <circle cx="37.5" cy="24" r="3" />
        <circle cx="34" cy="32.5" r="3" />
        <circle cx="24" cy="37" r="3" />
        <circle cx="14" cy="32.5" r="3" />
        <circle cx="10.5" cy="24" r="3" />
        <circle cx="14" cy="15.5" r="3" />
      </g>
      <circle cx="24" cy="24" r="4.6" fill="#a34d18" />
      <FloralAccent cx="8" cy="8" />
      <circle cx="40" cy="10" r="1.6" fill="#ecd18f" />
    </svg>
  ),

  japa_sunrise: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <path d="M8 30a16 16 0 0 1 32 0" fill="#f4d4a8" />
      <circle cx="24" cy="30" r="7" fill="#e6993f" />
      <g stroke="#c4651a" strokeWidth="1.4" strokeLinecap="round">
        <line x1="24" y1="14" x2="24" y2="18" />
        <line x1="13" y1="19" x2="16" y2="21.5" />
        <line x1="35" y1="19" x2="32" y2="21.5" />
      </g>
      <rect x="6" y="36" width="36" height="2.4" rx="1.2" fill="#dd7f22" opacity="0.5" />
    </svg>
  ),

  sunrise: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <path d="M6 30a18 18 0 0 1 36 0" fill="#f4d4a8" />
      <circle cx="24" cy="30" r="8" fill="#e6993f" />
      <g stroke="#c4651a" strokeWidth="1.6" strokeLinecap="round">
        <line x1="24" y1="10" x2="24" y2="15" />
        <line x1="9" y1="17" x2="12.5" y2="20" />
        <line x1="39" y1="17" x2="35.5" y2="20" />
      </g>
      <rect x="4" y="36" width="40" height="2.6" rx="1.3" fill="#dd7f22" opacity="0.5" />
    </svg>
  ),

  diya: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <path
        d="M23.6 15c1.8 2.4 2.4 4.4 1 6.2-1.1 1.4-1 3 .4 4a3.4 3.4 0 0 0 4.2-.4c1.4 3.6-1 8-5.6 8-4.9 0-8.2-4.6-6.4-9.2 1-2.6 3.6-4.2 6.4-8.6Z"
        fill="#e6993f"
      />
      <path d="M10 30c3-2 8-3 14-3s11 1 14 3" stroke="#a34d18" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M8 32c4-1.6 10-2.4 16-2.4S36 30.4 40 32" stroke="#c4651a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <FloralAccent cx="38" cy="12" />
    </svg>
  ),

  book: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <path d="M24 16c-3.4-2-8-2.6-11-1.6v17c3-1 7.6-.4 11 1.6Z" fill="#edb76f" />
      <path d="M24 16c3.4-2 8-2.6 11-1.6v17c-3-1-7.6-.4-11 1.6Z" fill="#e6993f" />
      <line x1="24" y1="16" x2="24" y2="33.6" stroke="#a34d18" strokeWidth="1.4" />
      <FloralAccent cx="10" cy="10" />
    </svg>
  ),

  headphones: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <path d="M12 27v-3a12 12 0 0 1 24 0v3" stroke="#c4651a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="9" y="26" width="7" height="10" rx="3" fill="#e6993f" />
      <rect x="32" y="26" width="7" height="10" rx="3" fill="#e6993f" />
      <FloralAccent cx="36" cy="10" />
    </svg>
  ),

  moon: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <path
        d="M31 14a12 12 0 1 0 4 20.6A14 14 0 0 1 31 14Z"
        fill="#c99a3e"
      />
      <circle cx="14" cy="16" r="1.3" fill="#ecd18f" />
      <circle cx="10" cy="24" r="1" fill="#ecd18f" />
    </svg>
  ),

  sprout: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <path d="M24 34V22" stroke="#729957" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 24c0-5 4-8 9-8-1 5-4 8-9 8Z" fill="#8fb672" />
      <path d="M24 27c0-4-3.5-7-8-7 1 4.5 3.6 7 8 7Z" fill="#aecb92" />
      <ellipse cx="24" cy="35" rx="9" ry="2.4" fill="#e7efdd" />
    </svg>
  ),

  flower_check: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <g>
        <circle cx="24" cy="17" r="4" fill="#ecd18f" />
        <circle cx="30" cy="21" r="4" fill="#edb76f" />
        <circle cx="28" cy="28" r="4" fill="#e6993f" />
        <circle cx="20" cy="28" r="4" fill="#edb76f" />
        <circle cx="18" cy="21" r="4" fill="#ecd18f" />
        <circle cx="24" cy="23" r="3.6" fill="#a34d18" />
      </g>
      <path d="M14 34l4 4 8-8" stroke="#729957" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),

  marks_glow: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <circle cx="24" cy="24" r="13" fill="#f4d4a8" />
      <path d="M24 15l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8Z" fill="#c4651a" />
      <circle cx="10" cy="10" r="1.4" fill="#ecd18f" />
      <circle cx="38" cy="12" r="1" fill="#ecd18f" />
    </svg>
  ),

  growth: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <polyline
        points="8,32 17,24 24,28 40,12"
        fill="none"
        stroke="#729957"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline points="32,12 40,12 40,20" fill="none" stroke="#729957" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  lotus_sparkles: (
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="#faf0d9" />
      <path d="M24 34c-8-2-13-8-13-15 4 2 8 5 13 12 5-7 9-10 13-12 0 7-5 13-13 15Z" fill="#e6993f" />
      <path d="M24 34c-4-4-6-9-6-15 3 2 5 6 6 11 1-5 3-9 6-11 0 6-2 11-6 15Z" fill="#edb76f" opacity="0.9" />
      <g fill="#ecd18f">
        <circle cx="10" cy="10" r="1.6" />
        <circle cx="38" cy="9" r="1.2" />
        <circle cx="40" cy="18" r="1" />
        <circle cx="6" cy="20" r="1" />
      </g>
    </svg>
  ),
};

export function Sticker({ name, size = 40, animation = "none", className }) {
  const icon = icons[name] || icons.flower_check;
  return (
    <Wrapper size={size} animation={animation} className={className}>
      {icon}
    </Wrapper>
  );
}

export const STICKER_NAMES = Object.keys(icons);

export default Sticker;
