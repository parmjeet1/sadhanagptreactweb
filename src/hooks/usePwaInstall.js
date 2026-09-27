import { useCallback, useEffect, useState } from 'react';

/**
 * usePwaInstall — platform detection + install-prompt plumbing for the
 * header "Install" control. Nothing here touches routing, auth, or any
 * existing app state; it only reads browser install-related signals.
 */

function detectStandalone() {
  if (typeof window === 'undefined') return false;
  const mql = window.matchMedia && window.matchMedia('(display-mode: standalone)');
  return Boolean(mql?.matches) || window.navigator?.standalone === true; // legacy iOS Safari flag
}

function detectPlatform() {
  if (typeof navigator === 'undefined') {
    return { isIOS: false, isMacSafari: false };
  }
  const ua = navigator.userAgent || navigator.vendor || '';
  // iPadOS 13+ reports a desktop-Safari-like UA, so a touch-capable
  // "MacIntel" platform is also treated as iOS.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafariEngine = /Safari/.test(ua) && !/Chrome|CriOS|Chromium|Edg|OPR|FxiOS/.test(ua);
  const isMac = /Mac/.test(navigator.platform || ua) && !isIOS;
  const isMacSafari = isMac && isSafariEngine;
  return { isIOS, isMacSafari };
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(detectStandalone);
  const [platform] = useState(detectPlatform);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      // Stop Chrome's default mini-infobar so our own button is the single
      // source of truth for install — the actual native prompt only ever
      // appears when the user taps that button.
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    // Covers the case where the user installs via the browser's own menu
    // (not our button) while this tab stays open.
    const mql = window.matchMedia && window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = () => setIsStandalone(detectStandalone());
    mql?.addEventListener?.('change', onDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      mql?.removeEventListener?.('change', onDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return null;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice; // { outcome: 'accepted' | 'dismissed' }
    // A captured beforeinstallprompt event can only be used once.
    setDeferredPrompt(null);
    return choice;
  }, [deferredPrompt]);

  const canInstallNatively = Boolean(deferredPrompt);
  const showIOSInstructions = platform.isIOS && !isStandalone;
  const showMacSafariInstructions = platform.isMacSafari && !isStandalone;

  // Only ever offer a real installation path — never a control that can't
  // actually do anything on this browser.
  const showInstallControl =
    !isStandalone && (canInstallNatively || showIOSInstructions || showMacSafariInstructions);

  return {
    isStandalone,
    canInstallNatively,
    showIOSInstructions,
    showMacSafariInstructions,
    showInstallControl,
    promptInstall,
  };
}

export default usePwaInstall;
