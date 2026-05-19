import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useGeminiStream } from "../hooks/useGeminiStream";


type InputMode = "text" | "voice";

const Playground: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<InputMode>("text");
  const { output, error, isLoading, metrics, runStream, setError } = useGeminiStream();
  const [isRecording, setIsRecording] = useState(false);
  const [, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSupported =
    typeof window !== "undefined" &&
    !!(
      window.SpeechRecognition ||
      window.webkitSpeechRecognition
    );

  useEffect(() => {
    if (mode !== "voice") {
      recognitionRef.current?.stop?.();
      setIsRecording(false);
      setInterimTranscript("");
      return;
    }

    if (!speechSupported) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is not available.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setError("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      if (event.results[0].isFinal) {
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setInterimTranscript("");
      } else {
        setInterimTranscript(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setError("Microphone timed out (no speech detected).");
      } else {
        setError(event.error ? `Voice recognition error: ${event.error}` : "Voice recognition failed.");
      }
      setIsRecording(false);
      setMode("text");
    };

    recognition.onend = () => {
      setIsRecording(false);
      setMode("text");
    };

    recognitionRef.current = recognition;
    recognition.start();

    return () => {
      recognition.stop?.();
    };
  }, [mode, speechSupported]);

  const handleRun = async () => {
    setError("");
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError("Please enter a prompt before running.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop?.();
      setIsRecording(false);
    }

    await runStream(trimmedPrompt);
  };

  return (
    <div className="panel playground-panel">
      <div className="panel-header">
        <div className="header-title">
          <img src="/icons8-cube-48.png" alt="Playground icon" className="header-icon" />
          <div>
            <h1>Playground</h1>
            <p>Use text or voice input to generate a response.</p>
          </div>
        </div>
      </div>
    <div className="prompt-box">
      <textarea
        id="playground-prompt"
        className="prompt-textarea"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading && prompt.trim() !== "") {
              handleRun();
            }
          }
        }}
        placeholder={mode === "voice" ? "I am Listening..." : "Type here..."}
        rows={4}
      />
        <div className="prompt-footer">
        <div className="mode-switch" role="group" aria-label="Input mode selector">
          <button
            type="button"
            className={`mode-button ${mode === "text" ? "active" : ""}`}
            onClick={() => setMode("text")}
            aria-label="Text input mode"
          >
            <img src="/text-svgrepo-com.svg" alt="Text mode" />
          </button>

          <button
            type="button"
            className={`mode-button ${mode === "voice" ? "active" : ""}`}
            onClick={() => setMode("voice")}
            aria-label="Voice input mode"
          >
            <img src="/voice-recognition-svgrepo-com.svg" alt="Voice mode" />
          </button>
        </div>
        <button type="button" className="run-button cursor-pointer playground-run" onClick={handleRun} disabled={isLoading || prompt.trim() === ""}>
          {isLoading ? "Running…" : "Run"}
        </button>
      </div>
      {error && <div className="error-text prompt-card-error" role="alert" aria-live="assertive">{error}</div>}
      </div>

      <div className="output-box output-box--playground">
        <div className="output-header">
          <div className="output-header-left">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon-output"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M7 7h10v6H7z" />
            </svg>
            <strong>Output</strong>
          </div>
          {(metrics.tokens > 0 || isLoading) && (
            <div className="metrics-display" aria-live="polite">
              <span className="metric-badge">{metrics.tokens} tokens</span>
              <span className="metric-badge">{metrics.tps} tokens/s</span>
            </div>
          )}
        </div>
        <div className="output-body">
          {!output && !isLoading && (
            <p className="placeholder">
              Playground output appears here after Run. Type "fail" to test error handling.
            </p>
          )}
          {isLoading && !output && <p className="placeholder">Generating output…</p>}
          {output && (
            <div className="output-content markdown-body" aria-live="polite">
              <ReactMarkdown>{output}</ReactMarkdown>
              {isLoading && <span className="streaming-cursor"></span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Playground;
