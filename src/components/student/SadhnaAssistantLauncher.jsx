import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import SadhnaAssistant from '../../sadhna-assistant/SadhnaAssistant';
import { RealSadhnaGptAdapter } from '../../sadhna-assistant/adapters/RealSadhnaGptAdapter';

/**
 * Floating launcher for the SadhnaAssistant chat widget — a single, big,
 * hard-to-miss button that opens the assistant in a slide-up panel. It sits
 * above the bottom navigation bar AND above DailyScoreIndicator's marks
 * bubble (fixed at bottom-[100px] right-6 — see components/shared/
 * DailyScoreIndicator.jsx) on every student page, since it's rendered from
 * BottomNavigation.jsx. The widget itself (src/sadhna-assistant) is
 * unchanged; this component only supplies the real backend adapter and the
 * open/close chrome around it.
 */
const SadhnaAssistantLauncher = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Created once and reused for the lifetime of this component so the chat
  // doesn't lose its adapter identity (and re-fetch everything) on re-render.
  const adapter = useMemo(() => new RealSadhnaGptAdapter(), []);

  return (
    <>
      <div className="fixed z-40 bottom-[176px] right-5">
        {/* Blinking ring behind the button — keeps it prominent without a person needing to notice a static icon. */}
        <span className="absolute inset-0 rounded-full bg-[#dd7f22] animate-ping opacity-60" />
        <motion.button
          type="button"
          onClick={() => setIsOpen(true)}
          whileTap={{ scale: 0.92 }}
          aria-label="Open Sadhna Assistant — speak or type your sadhna"
          className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#dd7f22] to-[#e6993f] text-white shadow-lg shadow-orange-500/40 flex items-center justify-center active:scale-95 transition-transform animate-sadhna-glow-loop"
        >
          <Mic className="w-7 h-7" strokeWidth={2.25} />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center sm:justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOpen(false);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full sm:max-w-md h-[92vh] sm:h-[820px] sm:max-h-[92vh] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl relative bg-cream-50"
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Sadhna Assistant"
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-[#0f172a]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <SadhnaAssistant adapter={adapter} className="rounded-none sm:rounded-3xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SadhnaAssistantLauncher;
