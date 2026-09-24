import React, { useMemo } from "react";
import SadhnaChat from "./SadhnaChat";
import { MockSadhnaAdapter } from "./adapters/MockSadhnaAdapter";

/**
 * ============================================================================
 * SadhnaAssistant — the single public entry point for this module.
 * ============================================================================
 *
 * Drop this component into any React app:
 *
 *   import SadhnaAssistant from "sadhna-assistant/SadhnaAssistant";
 *
 *   <SadhnaAssistant adapter={myRealSadhnaGptAdapter} />
 *
 * If no `adapter` is supplied, it falls back to MockSadhnaAdapter so the
 * module runs completely standalone (see adapters/MockSadhnaAdapter.js).
 * The host application is expected to eventually pass a real adapter that
 * implements the SadhnaAdapter interface (adapters/SadhnaAdapter.js) and
 * talks to the actual SadhnaGPT backend — this component and everything
 * beneath it never reaches outside of that interface.
 *
 * `className` / `style` let the host control how the assistant is sized —
 * by default it fills its parent container (mobile-first: designed to sit
 * inside a full-height mobile viewport or a fixed-size panel/modal alike).
 */
export function SadhnaAssistant({ adapter, className = "", style }) {
  const resolvedAdapter = useMemo(() => adapter || new MockSadhnaAdapter(), [adapter]);

  return (
    <div
      className={`w-full h-full max-w-md mx-auto flex flex-col overflow-hidden bg-cream-50 ${className}`}
      style={style}
    >
      <SadhnaChat adapter={resolvedAdapter} />
    </div>
  );
}

export default SadhnaAssistant;

export { MockSadhnaAdapter } from "./adapters/MockSadhnaAdapter";
export { SadhnaAdapter } from "./adapters/SadhnaAdapter";
