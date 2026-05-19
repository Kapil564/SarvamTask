import React, { useState } from 'react'
import { computeTokenDiff, type DiffToken } from '../lib/diff'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

const MODELS = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
]

const ModelDiff: React.FC = () => {
  const [leftModel, setLeftModel] = useState(MODELS[0])
  const [rightModel, setRightModel] = useState(MODELS[1])
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [diffTokens, setDiffTokens] = useState<DiffToken[] | null>(null)

  const handleRun = async () => {
    setError('')
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      setError('Please enter a text-only prompt for model diff.')
      return
    }

    setIsLoading(true)
    setDiffTokens(null)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your .env file.");

      const fetchOutput = async (model: string) => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: trimmedPrompt }] }]
          })
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`API Error from ${model}: ${response.status} - ${err}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      };

      const [leftText, rightText] = await Promise.all([
        fetchOutput(leftModel),
        fetchOutput(rightModel)
      ]);

      setDiffTokens(computeTokenDiff(leftText, rightText))
    } catch (err: any) {
      setError(err.message || 'Unable to compute model diff. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="panel model-diff-panel">
      <div className="panel-header">
        <div>
          <h1>Model Diff</h1>
          <p>Compare two model inputs and run a text-only prompt for the diff output.</p>
        </div>
      </div>

      <div className="prompt-card">
        <textarea
          id="diff-prompt-input"
          className="prompt-card-textarea"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Type your prompt..."
          rows={5}
        />

        <div className="prompt-card-actions">
          <div className="prompt-card-selects">
            <Select value={leftModel} onValueChange={setLeftModel}>
              <SelectTrigger className="model-select-pill">
                <SelectValue placeholder="Left model" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Models</SelectLabel>
                  {MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={rightModel} onValueChange={setRightModel}>
              <SelectTrigger className="model-select-pill">
                <SelectValue placeholder="Right model" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Models</SelectLabel>
                  {MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
            <button
              type="button"
              className="run-button send-button"
              onClick={handleRun}
              aria-label="Send prompt"
              title="Send"
            >
              {isLoading ? (
                'Running…'
              ) : (
                "Run"
              )}
            </button>
        </div>
      </div>
      <div>
         {error && <div className="error-text prompt-card-error">{error}</div>}
      </div>

      <div className="diff-grid">
        <div className="diff-card">
          <div className="diff-card-header">
            <span>{leftModel} output</span>
          </div>
          <div className="output-box diff-output-box">
            {isLoading && <p className="placeholder">Generating output for {leftModel}…</p>}
            {!isLoading && !diffTokens && <p className="placeholder">Output will appear here after Run.</p>}
            {!isLoading && diffTokens && (
              <div className="diff-content" aria-live="polite">
                {diffTokens.map((token, i) => {
                  if (token.type === 'equal') return <span key={i} className="diff-equal">{token.value}</span>
                  if (token.type === 'delete') return <span key={i} className="diff-delete">{token.value}</span>
                  return null
                })}
              </div>
            )}
          </div>
        </div>

        <div className="diff-card">
          <div className="diff-card-header">
            <span>{rightModel} output</span>
          </div>
          <div className="output-box diff-output-box">
            {isLoading && <p className="placeholder">Generating output for {rightModel}…</p>}
            {!isLoading && !diffTokens && <p className="placeholder">Output will appear here after Run.</p>}
            {!isLoading && diffTokens && (
              <div className="diff-content" aria-live="polite">
                {diffTokens.map((token, i) => {
                  if (token.type === 'equal') return <span key={i} className="diff-equal">{token.value}</span>
                  if (token.type === 'insert') return <span key={i} className="diff-insert">{token.value}</span>
                  return null
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModelDiff
