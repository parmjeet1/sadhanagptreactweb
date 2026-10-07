// While a full window (Marks window, a student's scheme) is open, the floating circles (Marks, chatbot,
// Birds-eye) are hidden. On phones the on-screen keyboard shrinks the screen, which lifts every bottom-anchored
// circle up behind the window's dark backdrop, and they seemed to "move" by themselves. Hidden circles
// cannot be seen jumping; they keep their exact place and come back when the window closes.
// (The rule is in index.css: html[data-floating-hidden] [data-floating-fab] { visibility: hidden }.)
let openWindows = 0;

export const hideFloatingIcons = () => {
  openWindows += 1;
  document.documentElement.setAttribute('data-floating-hidden', 'true');
  let released = false;
  return () => {
    if (released) return;
    released = true;
    openWindows = Math.max(0, openWindows - 1);
    if (openWindows === 0) document.documentElement.removeAttribute('data-floating-hidden');
  };
};
