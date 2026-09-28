import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePwaInstall } from '../../hooks/usePwaInstall';

const DownloadIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3v12" />
    <path d="M7.5 10.5L12 15l4.5-4.5" />
    <path d="M4.5 19.5h15" />
  </svg>
);

const ShareIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 16V4" />
    <path d="M8 8l4-4 4 4" />
    <rect x="4" y="10" width="16" height="10" rx="2" />
  </svg>
);

const AddSquareIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

const CheckIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const MenuBarIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="5" width="18" height="4" rx="1.5" />
    <path d="M6 12h12M6 16h8" />
  </svg>
);

/** Shared visual shell for both instruction sheets — bottom sheet on
 * mobile-width layouts, centered card on wider ones — styled to match the
 * rest of the app (white/slate surfaces, brand blue accents), not a
 * generic browser dialog. */
function InstructionSheet({ title, steps, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[80]"
      />
      <motion.div
        key="sheet"
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0.5 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[90] w-full sm:w-[380px] bg-white dark:bg-[#1e293b] rounded-t-3xl sm:rounded-3xl shadow-2xl px-6 pt-5 pb-8 sm:pb-6"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200 dark:bg-slate-600 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-extrabold text-[#0f172a] dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ol className="space-y-4">
          {steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="shrink-0 w-9 h-9 rounded-full bg-[#eff6ff] dark:bg-[#1a73e8]/20 text-[#1a73e8] flex items-center justify-center">
                {step.icon}
              </span>
              <p className="text-sm text-[#334155] dark:text-slate-200 pt-1.5">{step.text}</p>
            </li>
          ))}
        </ol>
      </motion.div>
    </AnimatePresence>
  );
}

function IOSInstallSheet({ onClose }) {
  return (
    <InstructionSheet
      title="Install SadhanaGPT"
      onClose={onClose}
      steps={[
        { icon: <ShareIcon className="w-4 h-4" />, text: <>Tap the <strong>Share</strong> button in your browser.</> },
        { icon: <AddSquareIcon className="w-4 h-4" />, text: <>Select <strong>"Add to Home Screen"</strong>.</> },
        { icon: <CheckIcon className="w-4 h-4" />, text: <>Tap <strong>"Add"</strong> to confirm.</> },
      ]}
    />
  );
}

function MacSafariInstallSheet({ onClose }) {
  return (
    <InstructionSheet
      title="Install SadhanaGPT"
      onClose={onClose}
      steps={[
        { icon: <MenuBarIcon className="w-4 h-4" />, text: <>Open <strong>File</strong> in the menu bar.</> },
        { icon: <AddSquareIcon className="w-4 h-4" />, text: <>Select <strong>"Add to Dock"</strong>.</> },
        { icon: <CheckIcon className="w-4 h-4" />, text: <>Confirm the app name and click <strong>Add</strong>.</> },
      ]}
    />
  );
}

/**
 * InstallButton — the header's "Install" pill. Renders nothing when the
 * app is already installed or when no real installation path exists on
 * the current browser (see usePwaInstall's showInstallControl).
 */
const InstallButton = () => {
  const {
    isStandalone,
    canInstallNatively,
    showIOSInstructions,
    showMacSafariInstructions,
    showInstallControl,
    promptInstall,
  } = usePwaInstall();

  const [sheet, setSheet] = useState(null); // null | 'ios' | 'mac'
  const [pulse, setPulse] = useState(true);

  // Subtle ONE-TIME pulse/glow when the control first becomes available —
  // not a continuous animation.
  useEffect(() => {
    if (!showInstallControl) return undefined;
    const timer = setTimeout(() => setPulse(false), 2200);
    return () => clearTimeout(timer);
  }, [showInstallControl]);

  if (isStandalone || !showInstallControl) return null;

  const handleClick = async () => {
    setPulse(false);
    if (canInstallNatively) {
      await promptInstall(); // browser's own native dialog; user decides accept/dismiss
      return;
    }
    if (showIOSInstructions) {
      setSheet('ios');
      return;
    }
    if (showMacSafariInstructions) {
      setSheet('mac');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Install SadhanaGPT"
        title="Install SadhanaGPT"
        className={`flex items-center justify-center gap-1.5 h-10 w-10 px-0 min-[400px]:w-auto min-[400px]:pl-3.5 min-[400px]:pr-4 rounded-full bg-[#1a73e8] text-white text-[13px] font-bold shadow-md shadow-[#1a73e8]/30 active:scale-95 transition-transform hover:brightness-110 shrink-0 ${
          pulse ? 'animate-install-pulse' : ''
        }`}
      >
        {/* On very narrow screens (<400px) this collapses to an icon-only
            circle matching the other header buttons' footprint, so the
            header never overflows — the pill + label shows from 400px up. */}
        <DownloadIcon className="w-4 h-4 shrink-0" />
        <span className="hidden min-[400px]:inline">Install</span>
      </button>

      {sheet === 'ios' && <IOSInstallSheet onClose={() => setSheet(null)} />}
      {sheet === 'mac' && <MacSafariInstallSheet onClose={() => setSheet(null)} />}
    </>
  );
};

export default InstallButton;
