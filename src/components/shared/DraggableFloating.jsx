import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Wraps a floating (position: fixed) button so the user can press, hold and
 * drag it anywhere on screen, mouse or touch.
 *
 * - The caller keeps full control of where the button STARTS: pass the same
 *   `fixed ... bottom-[..] right-[..]` classes through `className`.
 * - A plain tap/click still reaches the button inside. Only when the pointer
 *   moves more than DRAG_THRESHOLD px does it count as a drag, and the click
 *   that would follow the drag is swallowed so dropping the icon never
 *   triggers it.
 * - The icon is kept fully on screen (EDGE px margin) and above the bottom
 *   navigation bar (`bottomInset` px), also after a screen resize/rotation.
 * - The dropped position is remembered per `storageKey` only in memory, so it stays
 *   the same while moving between pages, but it is NOT saved: after a reload (or
 *   closing the app) every icon starts again at its default, aligned spot.
 */

const DRAG_THRESHOLD = 6; // px of movement before a press becomes a drag
const EDGE = 8; // px kept free at the screen edges

// In-memory only (lost on reload). Keyed by `storageKey` so an icon keeps its spot
// when you move between pages of the app.
const sessionOffsets = new Map();
const readSaved = (key) => sessionOffsets.get(key) || { x: 0, y: 0 };
const writeSaved = (key, offset) => sessionOffsets.set(key, offset);

// Positions used to be saved in localStorage ("floating-fab:*"). Those saved values no
// longer match the current layout and made icons overlap after a reload, so remove them.
try {
  Object.keys(window.localStorage)
    .filter((k) => k.startsWith('floating-fab:'))
    .forEach((k) => window.localStorage.removeItem(k));
} catch {
  // Storage blocked — nothing to clean up.
}

const DraggableFloating = ({
  storageKey,
  className = '',
  bottomInset = 88,
  containerRef,
  children,
}) => {
  const ownRef = useRef(null);
  const ref = containerRef || ownRef;
  const [offset, setOffset] = useState(() => readSaved(storageKey));
  const offsetRef = useRef(offset);
  const dragRef = useRef(null);
  const movedRef = useRef(false);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  // Keep a candidate offset inside the visible screen.
  const clamp = useCallback(
    (candidate) => {
      const el = ref.current;
      if (!el) return candidate;
      const rect = el.getBoundingClientRect();
      // Where the icon would sit with no offset applied.
      const baseLeft = rect.left - offsetRef.current.x;
      const baseRight = rect.right - offsetRef.current.x;
      const baseTop = rect.top - offsetRef.current.y;
      const baseBottom = rect.bottom - offsetRef.current.y;

      const minX = EDGE - baseLeft;
      const maxX = window.innerWidth - EDGE - baseRight;
      const minY = EDGE - baseTop;
      const maxY = window.innerHeight - bottomInset - baseBottom;

      return {
        x: Math.round(Math.min(Math.max(candidate.x, Math.min(minX, maxX)), Math.max(minX, maxX))),
        y: Math.round(Math.min(Math.max(candidate.y, Math.min(minY, maxY)), Math.max(minY, maxY))),
      };
    },
    [ref, bottomInset],
  );

  // Re-fit a remembered position on first paint and whenever the screen changes size.
  useLayoutEffect(() => {
    const refit = () => {
      const fitted = clamp(offsetRef.current);
      if (fitted.x !== offsetRef.current.x || fitted.y !== offsetRef.current.y) {
        offsetRef.current = fitted;
        setOffset(fitted);
        writeSaved(storageKey, fitted);
      }
    };
    refit();
    window.addEventListener('resize', refit);
    return () => window.removeEventListener('resize', refit);
  }, [clamp, storageKey]);

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    movedRef.current = false;
    dragRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offsetRef.current.x,
      originY: offsetRef.current.y,
      dragging: false,
    };
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.dragging = true;
      movedRef.current = true;
      try {
        ref.current?.setPointerCapture(e.pointerId);
      } catch {
        // Some browsers refuse capture — dragging still works while over the icon.
      }
    }

    const next = clamp({ x: drag.originX + dx, y: drag.originY + dy });
    offsetRef.current = next;
    setOffset(next);
  };

  const endDrag = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    dragRef.current = null;
    if (drag.dragging) {
      try {
        ref.current?.releasePointerCapture(e.pointerId);
      } catch {
        // Already released.
      }
      writeSaved(storageKey, offsetRef.current);
      // The click event that follows pointerup must be ignored; clear the flag after it.
      setTimeout(() => {
        movedRef.current = false;
      }, 0);
    }
  };

  return (
    <div
      ref={ref}
      data-floating-fab="true"
      className={`${className} select-none`}
      style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(e) => {
        if (movedRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {children}
    </div>
  );
};

export default DraggableFloating;
