import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";


type InputMode = "text" | "voice";

const Playground: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<InputMode>("text");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({ tokens: 0, tps: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const speechSupported =
    typeof window !== "undefined" &&
    !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
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
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
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

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");

      if (event.results[0].isFinal) {
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setInterimTranscript("");
      } else {
        setInterimTranscript(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      const message = event.error
        ? `Voice recognition error: ${event.error}`
        : "Voice recognition failed.";
      setError(message);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
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

    setIsLoading(true);
    setOutput("");
    setMetrics({ tokens: 0, tps: 0 });

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your .env file.");
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: trimmedPrompt }] }]
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let tokenCount = 0;
      let currentOutput = "";
      let buffer = "";
      const startTime = performance.now();

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (!dataStr) continue;
              
              try {
                const parsed = JSON.parse(dataStr);
                const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                
                if (textChunk) {
                  currentOutput += textChunk;
                  setOutput(currentOutput);
                  
                  // For this assignment, we increment the token counter per text chunk received
                  tokenCount++;
                  const elapsedSeconds = (performance.now() - startTime) / 1000;
                  setMetrics({
                    tokens: tokenCount,
                    tps: elapsedSeconds > 0 ? Math.round((tokenCount / elapsedSeconds) * 10) / 10 : 0,
                  });
                }
              } catch (e) {
                console.error("Error parsing chunk JSON", e, dataStr);
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError("Stream interrupted: " + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="panel playground-panel">
      <div className="panel-header">
        <div>
          <h1>Playground</h1>
          <p>Use text or voice input to generate a response.</p>
        </div>
      </div>
    <div className="prompt-box">
      <textarea
        id="playground-prompt"
        className="prompt-textarea"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder={mode === "voice" ? "I am Listening..." : "Type here..."}
        rows={8}
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
