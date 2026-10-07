import React, { useEffect, useRef, useState } from "react";
import { Send, Mic, Square } from "lucide-react";

const SpeechRecognitionCtor =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

// Voice input uses the BROWSER's own speech recognition (Web Speech API) on
// every device — Android, iPhone, desktop. Nothing is recorded or sent to our
// backend, so it needs no server key and works the same everywhere. On a
// browser that does not support it at all (e.g. some in-app webviews), the mic
// button is simply hidden and the user types instead.
const IDLE_STOP_MS = 5 * 60 * 1000; // safety: closes by itself only after 5 minutes with no speech
const FORCE_STOP_MS = 1500; // if the browser is slow to end after stop(), abort
const RESTART_DELAY_MS = 150; // the browser ends each phrase; we reopen it right away
const MAX_QUICK_FAILURES = 5; // give up if the browser keeps ending instantly

const ERROR_MESSAGES = {
  "not-allowed": "Microphone access denied — allow it in your browser's site settings and try again.",
  "permission-denied": "Microphone access denied — allow it in your browser's site settings and try again.",
  "service-not-allowed": "Voice input isn't allowed on this page (needs HTTPS or localhost).",
  "audio-capture": "No microphone was found on this device.",
  "no-speech": "Didn't catch that — tap the mic and try again.",
  network: "Speech service unavailable — check your connection and try again.",
};

/**
 * The persistent "Just write/Speak your Sadhna" free-text bar, always
 * available at the bottom of the chat regardless of which flow/step is
 * active. `activityNames` is the live, dynamic list of active activities
 * (never hard-coded) shown in brackets as a hint of what can be filled.
 *
 * Offers a microphone button for dictating the update instead of typing it,
 * using the browser's built-in speech recognition. The words appear in the box
 * live while speaking. Like the Google keyboard mic, it STAYS ON between
 * pauses (the browser's short sessions are reopened automatically) until the
 * user taps the button again, or after IDLE_STOP_MS with no speech.
 */
export function NLInputBar({ onSend, disabled, activityNames = [] }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");
  const recognitionRef = useRef(null);
  const startingRef = useRef(false);
  const wantListeningRef = useRef(false); // what the user wants: mic on until they turn it off
  const textRef = useRef("");
  const quickFailuresRef = useRef(0);
  const errorTimeoutRef = useRef(null);
  const idleTimerRef = useRef(null);
  const forceStopTimerRef = useRef(null);
  const restartTimerRef = useRef(null);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const clearListenTimers = () => {
    clearTimeout(idleTimerRef.current);
    clearTimeout(forceStopTimerRef.current);
    clearTimeout(restartTimerRef.current);
  };

  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      clearListenTimers();
      recognitionRef.current?.abort();
      clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const showMicError = (message) => {
    if (!message) return;
    setMicError(message);
    clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setMicError(""), 4000);
  };

  /** Turns the mic fully off (user tapped it, idle timeout, or a real error). */
  const stopListening = () => {
    wantListeningRef.current = false;
    clearTimeout(restartTimerRef.current);
    clearTimeout(idleTimerRef.current);
    const recognition = recognitionRef.current;
    if (!recognition) {
      setListening(false);
      return;
    }
    recognition.stop();
    // Some mobile browsers are slow (or fail) to fire "end" after stop() —
    // make sure the mic really closes and the button resets.
    clearTimeout(forceStopTimerRef.current);
    forceStopTimerRef.current = setTimeout(() => {
      recognition.abort();
      setListening(false);
    }, FORCE_STOP_MS);
  };

  const resetIdleTimer = () => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(stopListening, IDLE_STOP_MS);
  };

  /** Opens one browser speech session. When the browser ends it (after a
   * pause), onend opens the next one while the user still wants the mic on. */
  const beginSession = () => {
    // A fresh instance every time — reusing an ended one is a common source of instant-stop bugs.
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true; // show words while speaking
    recognition.maxAlternatives = 1;
    recognition.lang = "en-IN";

    const prefix = textRef.current.trim() ? `${textRef.current.trim()} ` : "";
    const startedAt = Date.now();
    let gotWords = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += `${piece} `;
        else interimText += piece;
      }
      const spoken = `${finalText}${interimText}`.trim();
      if (spoken) {
        gotWords = true;
        quickFailuresRef.current = 0;
        resetIdleTimer();
        setText(`${prefix}${spoken}`.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return; // normal while waiting; we reopen below
      // A real problem (permission, no mic, no network): stop for good and say why.
      wantListeningRef.current = false;
      showMicError(ERROR_MESSAGES[event.error] || "Voice input isn't available right now.");
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      clearTimeout(forceStopTimerRef.current);
      if (!wantListeningRef.current) {
        clearListenTimers();
        setListening(false);
        return;
      }
      // The user hasn't turned the mic off — keep it on, like the Google keyboard mic.
      if (!gotWords && Date.now() - startedAt < 400) quickFailuresRef.current += 1;
      if (quickFailuresRef.current >= MAX_QUICK_FAILURES) {
        wantListeningRef.current = false;
        clearListenTimers();
        setListening(false);
        showMicError("Voice input keeps closing — tap the mic to try again.");
        return;
      }
      restartTimerRef.current = setTimeout(() => {
        if (!wantListeningRef.current) return;
        try {
          beginSession();
        } catch {
          quickFailuresRef.current += 1;
          recognition.onend?.();
        }
      }, RESTART_DELAY_MS);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const startListening = async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setMicError("");

    try {
      // Request mic permission explicitly first. Letting SpeechRecognition
      // negotiate permission on its own is what causes the classic "starts
      // then immediately stops" bug in Chrome — the audio pipeline hasn't
      // warmed up yet when recognition.start() fires, so it aborts right
      // away. Asking via getUserMedia first avoids that race.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop()); // we only needed the permission grant
      } catch (err) {
        showMicError(ERROR_MESSAGES[err.name?.toLowerCase()] || ERROR_MESSAGES["not-allowed"]);
        return;
      }

      wantListeningRef.current = true;
      quickFailuresRef.current = 0;
      try {
        beginSession();
        resetIdleTimer();
      } catch {
        // Already-started/invalid-state — reset so the next click gets a clean instance.
        wantListeningRef.current = false;
        recognitionRef.current = null;
        setListening(false);
      }
    } finally {
      startingRef.current = false;
    }
  };

  const toggleListening = () => {
    if (!SpeechRecognitionCtor) return;
    if (listening) stopListening();
    else startListening();
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    textRef.current = "";
    // Mic stays on after sending; restart its session so words already sent
    // are not put back into the box.
    if (wantListeningRef.current) recognitionRef.current?.abort();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const hint = activityNames.length ? ` (${activityNames.join(", ")})` : "";

  return (
    <div className="border-t border-saffron-100 bg-cream-50 px-3 py-2.5">
      <p className="text-[11px] text-saffron-600 mb-1.5 px-1">
        Just write/Speak your Sadhna
        <span className="text-saffron-400">{hint}</span>
      </p>
      {micError && <p className="text-[11px] text-saffron-700 bg-saffron-100 rounded-lg px-2 py-1 mb-1.5">{micError}</p>}
      <div className="flex items-end gap-2">
        <textarea
          rows={2}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={listening ? "Listening..." : "e.g. 16 rounds, woke at 4:25..."}
          className="flex-1 min-w-0 resize-none px-4 py-2.5 h-20 rounded-2xl border border-saffron-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-saffron-300 disabled:opacity-60"
        />
        <div className="flex flex-col gap-2 shrink-0">
          {SpeechRecognitionCtor && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={disabled}
              aria-label={listening ? "Stop listening" : "Speak"}
              className={`h-10 w-10 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                ${listening ? "bg-saffron-700 text-white animate-sadhna-glow" : "bg-cream-200 text-saffron-700 hover:bg-saffron-100"}`}
            >
              {listening ? <Square size={15} /> : <Mic size={17} />}
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !text.trim()}
            aria-label="Send"
            className="h-10 w-10 flex items-center justify-center rounded-full bg-saffron-500 text-white
              hover:bg-saffron-600 active:bg-saffron-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NLInputBar;
