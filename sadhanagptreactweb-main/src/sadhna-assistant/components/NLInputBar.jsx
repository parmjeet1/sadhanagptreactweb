import React, { useEffect, useRef, useState } from "react";
import { Send, Mic, Square } from "lucide-react";

const SpeechRecognitionCtor =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

// Live Web Speech API transcription (Chrome/Android) is the first choice
// when available. Many mobile browsers — most notably iOS Safari and the
// in-app webviews the app is often opened from — implement neither
// SpeechRecognition nor webkitSpeechRecognition at all, which is why the
// mic used to simply vanish on mobile. MediaRecorder + getUserMedia is
// supported far more broadly (including iOS Safari 14.3+), so when native
// speech recognition isn't available but recording is, the mic still shows
// up and instead records a short clip and sends it to the backend (which
// transcribes it via OpenAI) — see RealSadhnaGptAdapter.transcribeVoiceNote.
const canRecordAudio =
  typeof window !== "undefined" &&
  !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
  typeof window.MediaRecorder !== "undefined";

const RECORDER_MIME_CANDIDATES = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
function pickRecorderMimeType() {
  if (typeof window === "undefined" || !window.MediaRecorder?.isTypeSupported) return "";
  return RECORDER_MIME_CANDIDATES.find((t) => window.MediaRecorder.isTypeSupported(t)) || "";
}

const ERROR_MESSAGES = {
  "not-allowed": "Microphone access denied — allow it in your browser's site settings and try again.",
  "permission-denied": "Microphone access denied — allow it in your browser's site settings and try again.",
  "service-not-allowed": "Voice input isn't allowed on this page (needs HTTPS or localhost).",
  "audio-capture": "No microphone was found on this device.",
  "no-speech": "Didn't catch that — tap the mic and try again.",
  network: "Speech service unavailable — check your connection and try again.",
};

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",").pop());
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * The persistent "Just write/Speak your Sadhna" free-text bar, always
 * available at the bottom of the chat regardless of which flow/step is
 * active. `activityNames` is the live, dynamic list of active activities
 * (never hard-coded) shown in brackets as a hint of what can be filled.
 *
 * Offers a microphone button for dictating the update instead of typing it
 * — Web Speech API live transcription where supported, otherwise a
 * record-and-transcribe fallback (see `canRecordAudio` above) so voice
 * input works on mobile too, not just desktop Chrome. The mic is only
 * hidden on the rare browser that supports neither.
 */
export function NLInputBar({ onSend, disabled, activityNames = [], adapter }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micError, setMicError] = useState("");
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
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
    recognitionRef.current?.stop();
  };

  const startListening = async () => {
    setMicError("");

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
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    const prefix = text.trim() ? `${text.trim()} ` : "";
    let finalTranscript = "";

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += `${chunk} `;
        else interim += chunk;
      }
      setText(`${prefix}${finalTranscript}${interim}`.trim());
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        showMicError(ERROR_MESSAGES[event.error] || "Voice input isn't available right now.");
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // Already-started/invalid-state — reset so the next click gets a clean instance.
      recognitionRef.current = null;
      setListening(false);
    }
  };

  // ---------------------------------------------------------------------
  // Record-and-transcribe fallback (browsers without SpeechRecognition —
  // notably iOS Safari and most in-app webviews).
  // ---------------------------------------------------------------------
  const stopRecording = () => {
    mediaRecorderRef.current?.stop(); // onstop below handles the rest
  };

  const startRecording = async () => {
    setMicError("");
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      showMicError(ERROR_MESSAGES[err.name?.toLowerCase()] || ERROR_MESSAGES["not-allowed"]);
      return;
    }

    mediaStreamRef.current = stream;
    mediaChunksRef.current = [];
    const mimeType = pickRecorderMimeType();
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) mediaChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      setListening(false);

      const blob = new Blob(mediaChunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
      mediaChunksRef.current = [];

      if (blob.size < 500) return; // essentially empty — user tapped stop instantly

      if (!adapter?.transcribeVoiceNote) {
        showMicError("Voice input isn't available right now.");
        return;
      }

      setTranscribing(true);
      try {
        const base64 = await blobToBase64(blob);
        const transcript = await adapter.transcribeVoiceNote(base64, blob.type);
        if (transcript) {
          const prefix = text.trim() ? `${text.trim()} ` : "";
          setText(`${prefix}${transcript}`.trim());
        } else {
          showMicError("Didn't catch that — tap the mic and try again.");
        }
      } catch {
        showMicError("Couldn't understand that voice note — please try again or type instead.");
      } finally {
        setTranscribing(false);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setListening(true);
  };

  const toggleListening = () => {
    if (SpeechRecognitionCtor) {
      if (listening) stopListening();
      else startListening();
    } else if (canRecordAudio) {
      if (listening) stopRecording();
      else startRecording();
    }
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
          disabled={disabled || transcribing}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={listening ? "Listening..." : transcribing ? "Transcribing your voice note..." : "e.g. 16 rounds, woke at 4:25..."}
          className="flex-1 min-w-0 resize-none px-4 py-2.5 h-20 rounded-2xl border border-saffron-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-saffron-300 disabled:opacity-60"
        />
        <div className="flex flex-col gap-2 shrink-0">
          {(SpeechRecognitionCtor || canRecordAudio) && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={disabled || transcribing}
              aria-label={listening ? "Stop listening" : "Speak"}
              className={`h-10 w-10 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                ${listening ? "bg-saffron-700 text-white animate-sadhna-glow" : "bg-cream-200 text-saffron-700 hover:bg-saffron-100"}`}
            >
              {listening ? (
                <Square size={15} />
              ) : transcribing ? (
                <span className="w-3 h-3 rounded-full border-2 border-saffron-700 border-t-transparent animate-spin" />
              ) : (
                <Mic size={17} />
              )}
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
