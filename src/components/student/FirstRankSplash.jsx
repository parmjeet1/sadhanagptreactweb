import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CONFETTI_COLORS = ["#FFD700", "#a78bfa", "#60a5fa", "#f0abfc", "#34d399", "#fb923c"];
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 2.5,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}));

const Particle = ({ delay, x, color }) => (
  <motion.div
    className="absolute rounded-full"
    style={{ left: `${x}%`, backgroundColor: color, top: "-8px", width: "6px", height: "6px" }}
    initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
    animate={{ y: "110vh", opacity: [1, 1, 0], rotate: 720, scale: [1, 0.4] }}
    transition={{ duration: 3.5 + Math.random() * 2, delay, ease: "easeIn", repeat: Infinity, repeatDelay: Math.random() * 3 }}
  />
);

const FirstRankSplash = ({ isVisible, studentName, score, rankText = "#1 Rank!", subtitle = "You've topped the leaderboard", onContinue }) => {
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => {
    if (isVisible) setTimeout(() => setShimmer(true), 500);
    else setShimmer(false);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden px-4"
          style={{ background: "linear-gradient(135deg, #e0d7ff 0%, #c7d7ff 30%, #d4e4ff 55%, #f5e3ff 80%, #fff8e1 100%)" }}
        >
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {PARTICLES.map(p => <Particle key={p.id} x={p.x} delay={p.delay} color={p.color} />)}
          </div>

          {/* Ambient orbs — scaled down on small screens */}
          <div className="absolute -top-16 -left-12 w-48 h-48 sm:w-72 sm:h-72 rounded-full bg-purple-300/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-10 w-40 h-40 sm:w-60 sm:h-60 rounded-full bg-blue-300/30 blur-3xl pointer-events-none" />
          <div className="absolute top-[40%] -left-16 w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-yellow-200/30 blur-3xl pointer-events-none" />

          {/* Card — fills screen on very small phones, capped on large */}
          <motion.div
            initial={{ scale: 0.75, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 180, delay: 0.1 }}
            className="relative w-full max-w-sm"
            style={{
              background: "rgba(255,255,255,0.58)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              borderRadius: "28px",
              border: "1.5px solid rgba(255,255,255,0.85)",
              boxShadow: "0 16px 60px rgba(167,139,250,0.25), 0 6px 24px rgba(0,0,0,0.07)",
              padding: "clamp(24px, 6vw, 40px) clamp(20px, 6vw, 32px) clamp(20px, 5vw, 32px)",
            }}
          >
            {/* Crown — scales with screen */}
            <motion.div
              className="flex justify-center mb-3 sm:mb-5"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{ background: "radial-gradient(circle, rgba(255,215,0,0.5) 0%, transparent 70%)", transform: "scale(1.6)" }}
                />
                <span
                  style={{
                    fontSize: "clamp(60px, 18vw, 88px)",
                    lineHeight: 1,
                    display: "block",
                    filter: "drop-shadow(0 4px 14px rgba(255,180,0,0.65))"
                  }}
                  role="img"
                  aria-label="crown"
                >
                  👑
                </span>
              </div>
            </motion.div>

            {/* Label */}
            <p
              className="text-center font-black uppercase tracking-[0.18em] mb-1.5"
              style={{ color: "#a78bfa", fontSize: "clamp(9px, 2.5vw, 11px)" }}
            >
              Achievement Unlocked
            </p>

            {/* Rank text */}
            <div className="text-center mb-1.5 relative overflow-hidden">
              <h1
                className="font-black leading-none"
                style={{
                  fontSize: "clamp(32px, 10vw, 48px)",
                  background: "linear-gradient(135deg, #FFD700 0%, #f59e0b 40%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {rankText}
              </h1>
              {shimmer && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%)" }}
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.5 }}
                />
              )}
            </div>

            {/* Name */}
            <p
              className="text-center font-bold text-[#0f172a] mb-0.5"
              style={{ fontSize: "clamp(14px, 4.5vw, 18px)" }}
            >
              Congratulations, {studentName || "Devotee"}!
            </p>
            <p
              className="text-center text-gray-500 font-medium mb-4 sm:mb-6"
              style={{ fontSize: "clamp(11px, 3vw, 13px)" }}
            >
              {subtitle}
            </p>

            {/* Score pill */}
            {score != null && (
              <div
                className="flex items-center justify-center gap-2 mx-auto mb-4 sm:mb-7 px-4 py-2 rounded-full"
                style={{
                  background: "rgba(167,139,250,0.12)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  width: "fit-content"
                }}
              >
                <span style={{ fontSize: "clamp(12px, 3.5vw, 14px)" }}>⭐</span>
                <span className="font-bold text-[#7c3aed]" style={{ fontSize: "clamp(12px, 3.5vw, 14px)" }}>
                  {score} pts
                </span>
                <span className="text-gray-400 font-medium" style={{ fontSize: "clamp(10px, 2.8vw, 12px)" }}>
                  total score
                </span>
              </div>
            )}

            {/* Continue button */}
            <motion.button
              onClick={onContinue}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-2xl font-black flex items-center justify-center gap-2 relative overflow-hidden text-white"
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #60a5fa 100%)",
                boxShadow: "0 8px 24px rgba(167,139,250,0.45)",
                padding: "clamp(12px, 3.5vw, 16px) 0",
                fontSize: "clamp(14px, 4vw, 16px)",
              }}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)" }}
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 }}
              />
              Continue
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstRankSplash;
