# Enterprise LLM Developer Portal

A high-performance React frontend built for enterprise developers to test on-device inference, experiment with live streaming models, and perform deep token-level diff analysis on LLM outputs. 

This project was built as a Frontend Intern Assignment and fully integrates with the **Google Gemini API** (using models like `gemini-flash-lite-latest` and `gemini-2.5-flash`).

## ✨ Features

### Part A: Inference Playground
- **Real-Time Streaming**: Implements true token-by-token streaming using the Fetch API and `ReadableStream`. The UI does not wait for the response to finish; it compiles raw Markdown to styled HTML dynamically via `react-markdown`.
- **Live Metrics Engine**: Displays live tokens-per-second (TPS) and total token counts as chunks hit the stream buffer.
- **Resilient Error Handling**: Safely captures network drops mid-stream (you can test this by typing `"fail"` to trigger a mock disruption or by intentionally disconnecting the network). It gracefully preserves all partial text without blanking the screen and fires an ARIA-assertive error banner.
- **Multimodal Toggle**: Accessible toggle between text and voice modes (voice requires browser support).

### Part B: Model Output Diff View
- **Parallel AI Fetching**: Select two different LLM models and dispatch parallel generation requests to the Gemini API.
- **Custom Token-Level Diffing**: Built 100% from scratch. It uses a **Greedy Token Matching with Lookahead** algorithm (O(N) time complexity) to highlight exact insertions and deletions word-by-word. It is significantly faster and more memory-efficient than a standard Longest Common Subsequence (LCS) matrix.
- **No External Diff Libraries**: The core difference calculation relies solely on custom Typescript algorithms located in `src/lib/diff.ts`.

### Accessibility (WCAG AA Compliant)
- **Tablist Navigation**: The top Navbar implements a robust roving `tabIndex` architecture. Press `Tab` to focus, then use your `Left Arrow` and `Right Arrow` keys to rapidly switch between the Playground and Model Diff views.
- **Semantic ARIA**: Implements polite/assertive live regions, properly labeled buttons, and role-based groupings.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <repo-folder>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root of the project and add your Gemini API key (ensure it uses the `VITE_` prefix):
   ```bash
   VITE_GEMINI_API_KEY="your_api_key_here"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 📁 Key Files & Documentation
- `submission_report.md`: Contains the comprehensive write-up of architectural decisions, error handling, accessibility, and time complexities.
- `Algorithm.md`: An in-depth explanation of the custom `Greedy Token Matching` diff algorithm and why it outperforms traditional LCS for LLM analysis.
- `src/lib/diff.ts`: The core logic for token-level diffing.
- `src/component/Playground.tsx`: The primary interface for SSE streaming and markdown parsing.

## 🛠️ Built With
- **React 19**
- **TypeScript**
- **Vite**
- **Google Gemini REST API**
- **React-Markdown**
