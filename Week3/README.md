# Smart Task Planner — Week 3

Builds on the Week 2 Task Manager. Enter a goal, and Gemini breaks it into a
step-by-step plan (task name, priority, estimated time). Each step can be
added straight into the existing task list.

## Why there's a `server.js`

The assignment note says the Gemini API key must never be public. A plain
`index.html`/`script.js` page has no safe way to hold a secret — anything in
client-side JS is visible to every visitor. So this project adds a tiny
Express server that:

- serves `index.html`, `style.css`, and `script.js` as static files
- exposes one endpoint, `POST /api/plan`, which is the only place
  `GEMINI_API_KEY` is read (from `.env`, via `dotenv`) and used
- the browser only ever talks to `/api/plan` on your own server — it never
  sees the key

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your API key**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and paste in a key from [Google AI Studio](https://aistudio.google.com/apikey).

3. **Run it**
   ```bash
   npm start
   ```
   Then open http://localhost:3000

`.env` is listed in `.gitignore`, so it will never be committed — only
`.env.example` (with no real key) is tracked in git.

## How it works

1. You type a goal (e.g. "Plan a weekend trip to Goa") and click **Generate Plan**.
2. The frontend (`script.js`) POSTs `{ goal }` to `/api/plan`.
3. `server.js` sends a prompt to the Gemini API (`gemini-2.5-flash` by
   default, configurable via `GEMINI_MODEL` in `.env`), using
   `responseMimeType: "application/json"` plus a `responseSchema` so Gemini
   always replies with a clean JSON array of
   `{ task, priority, estimatedTime }` objects — no manual text-cleanup needed.
4. The steps are rendered as a numbered, step-wise list with color-coded
   priority badges and an estimated time for each. You can add a single step
   or all of them to your task list below with one click.
5. While waiting on Gemini, a loading spinner is shown ("Talking to Gemini
   and building your plan…") and the **Generate Plan** button is disabled.
6. If anything fails — no internet, an invalid/missing API key, a Gemini
   error, a timeout, or a malformed response — a clear error message is
   shown in place of the results instead of the app breaking silently.

## Files

```
Week3/
├── index.html      Smart Planner UI + the original Week 2 task manager
├── style.css        Styling for both sections
├── script.js         Frontend logic: calls /api/plan, renders steps & tasks
├── server.js         Express backend: the only file that touches Gemini/API key
├── package.json
├── .env.example      Template for your own .env (no real key)
└── .gitignore         Excludes node_modules/ and .env from git
```
