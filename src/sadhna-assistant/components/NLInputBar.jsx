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
const MAX_LISTEN_MS = 60000; // safety: the mic always closes after 60 seconds
const FORCE_STOP_MS = 1500; // if the browser is slow to end after stop(), abort

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
 * live while speaking. The mic closes by itself when the user stops talking,
 * when they tap the button again, or after MAX_LISTEN_MS at the latest.
 */
export function NLInputBar({ onSend, disabled, activityNames = [] }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");
  const recognitionRef = useRef(null);
  const startingRef = useRef(false);
  const errorTimeoutRef = useRef(null);
  const maxTimerRef = useRef(null);
  const forceStopTimerRef = useRef(null);

  const clearListenTimers = () => {
    clearTimeout(maxTimerRef.current);
    clearTimeout(forceStopTimerRef.current);
  };

  useEffect(() => {
    return () => {
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

  const stopListening = () => {
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

      // Build a fresh recognition instance per attempt rather than reusing
      // one across the component's lifetime — reusing a previously-aborted
      // instance is a common source of the same instant-stop behavior.
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = false; // closes by itself after the user pauses
      recognition.interimResults = true; // show words while speaking
      recognition.maxAlternatives = 1;
      recognition.lang = "en-IN";

      const prefix = text.trim() ? `${text.trim()} ` : "";

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
        if (spoken) setText(`${prefix}${spoken}`.trim());
      };

      recognition.onerror = (event) => {
        if (event.error !== "aborted") {
          showMicError(ERROR_MESSAGES[event.error] || "Voice input isn't available right now.");
        }
      };

      recognition.onend = () => {
        clearListenTimers();
        setListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        clearTimeout(maxTimerRef.current);
        maxTimerRef.current = setTimeout(stopListening, MAX_LISTEN_MS);
      } catch {
        // Already-started/invalid-state — reset so the next click gets a clean instance.
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
