import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CONFETTI_COLORS = ["#FFD700", "#a78bfa", "#60a5fa", "#f0abfc", "#34d399", "#fb923c"];
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 2.5,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}));

const Particle = ({ delay, x, color }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full"
    style={{ left: `${x}%`, backgroundColor: color, top: "-8px" }}
    initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
    animate={{ y: "110vh", opacity: [1, 1, 0], rotate: 720, scale: [1, 0.5] }}
    transition={{ duration: 3.5 + Math.random() * 2, delay, ease: "easeIn", repeat: Infinity, repeatDelay: Math.random() * 3 }}
  />
);

const FirstRankSplash = ({ isVisible, studentName, score, onContinue }) => {
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => {
    if (isVisible) setTimeout(() => setShimmer(true), 500);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #e0d7ff 0%, #c7d7ff 30%, #d4e4ff 55%, #f5e3ff 80%, #fff8e1 100%)" }}
        >
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {PARTICLES.map(p => <Particle key={p.id} x={p.x} delay={p.delay} color={p.color} />)}
          </div>

          {/* Ambient orbs */}
          <div className="absolute top-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full bg-purple-300/30 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-60px] right-[-40px] w-[250px] h-[250px] rounded-full bg-blue-300/30 blur-3xl pointer-events-none" />
          <div className="absolute top-[40%] left-[-80px] w-[200px] h-[200px] rounded-full bg-yellow-200/30 blur-3xl pointer-events-none" />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.7, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 180, delay: 0.1 }}
            className="relative mx-6 w-full max-w-sm"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              borderRadius: "32px",
              border: "1.5px solid rgba(255,255,255,0.85)",
              boxShadow: "0 20px 70px rgba(167,139,250,0.25), 0 8px 32px rgba(0,0,0,0.08)",
              padding: "40px 32px 36px",
            }}
          >
            {/* Crown */}
            <motion.div
              className="flex justify-center mb-5"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{ background: "radial-gradient(circle, rgba(255,215,0,0.5) 0%, transparent 70%)", transform: "scale(1.6)" }}
                />
                <span style={{ fontSize: "90px", lineHeight: 1, display: "block", filter: "drop-shadow(0 4px 16px rgba(255,180,0,0.7))" }} role="img" aria-label="crown">
                  👑
                </span>
              </div>
            </motion.div>

            {/* Label */}
            <p className="text-center text-[11px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: "#a78bfa" }}>
              Achievement Unlocked
            </p>

            {/* Rank text */}
            <div className="text-center mb-2 relative overflow-hidden">
              <h1 className="text-[52px] font-black leading-none" style={{
                background: "linear-gradient(135deg, #FFD700 0%, #f59e0b 40%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                #1 Rank!
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
            <p className="text-center font-bold text-[#0f172a] text-[18px] mb-1">
              Congratulations, {studentName || "Devotee"}!
            </p>
            <p className="text-center text-[13px] text-gray-500 font-medium mb-6">
              You&apos;ve topped the leaderboard today
            </p>

            {/* Score */}
            {score != null && (
              <div
                className="flex items-center justify-center gap-2 mx-auto mb-8 px-5 py-2.5 rounded-full"
                style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)" }}
              >
                <span className="text-[14px]">⭐</span>
                <span className="font-bold text-[14px] text-[#7c3aed]">{score} pts</span>
                <span className="text-[12px] text-gray-400 font-medium">today&apos;s score</span>
              </div>
            )}

            {/* Button */}
            <motion.button
              onClick={onContinue}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-black text-[16px] flex items-center justify-center gap-2 relative overflow-hidden text-white"
              style={{ background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #60a5fa 100%)", boxShadow: "0 8px 24px rgba(167,139,250,0.45)" }}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)" }}
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 }}
              />
              Continue
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
