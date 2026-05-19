import { useState } from 'react';

export const useGeminiStream = () => {
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({ tokens: 0, tps: 0 });

  const runStream = async (prompt: string, model: string = "gemini-flash-lite-latest") => {
    setIsLoading(true);
    setOutput("");
    setError("");
    setMetrics({ tokens: 0, tps: 0 });

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your .env file.");
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
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
                  
                  // A standard heuristic: ~4 characters per token
                  const estimatedTokens = Math.ceil(textChunk.length / 4);
                  tokenCount += estimatedTokens;
                  
                  // Cap minimum elapsed time at 50ms to prevent massive TPS math spikes
                  const elapsedSeconds = Math.max(0.05, (performance.now() - startTime) / 1000);
                  setMetrics({
                    tokens: tokenCount,
                    tps: Math.round((tokenCount / elapsedSeconds) * 10) / 10,
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

  return { output, error, isLoading, metrics, runStream, setError };
};
