// =========================================================
// Smart Task Planner - backend
//
// Serves the static frontend (index.html / style.css / script.js)
// and exposes POST /api/plan, which is the ONLY place the Gemini
// API key is ever used. The browser never sees GEMINI_API_KEY -
// it only talks to this server, which talks to Gemini.
// =========================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_GOAL_LENGTH = 300;
const REQUEST_TIMEOUT_MS = 25000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// JSON schema Gemini must conform to. Combined with
// responseMimeType: "application/json" below, this makes Gemini
// return a clean, directly-parseable JSON array every time.
const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      task: { type: "STRING" },
      priority: { type: "STRING", enum: ["High", "Medium", "Low"] },
      estimatedTime: { type: "STRING" },
    },
    required: ["task", "priority", "estimatedTime"],
    propertyOrdering: ["task", "priority", "estimatedTime"],
  },
};

function buildPrompt(goal) {
  return (
    `You are a task-planning assistant. Break the following goal down into a clear, ` +
    `ordered, step-by-step list of actionable tasks needed to achieve it. ` +
    `Use between 4 and 10 steps depending on how complex the goal is, ordered in the ` +
    `sequence they should be done.\n\n` +
    `Goal: "${goal}"\n\n` +
    `For every step provide:\n` +
    `- task: a short, actionable task name\n` +
    `- priority: "High", "Medium", or "Low"\n` +
    `- estimatedTime: a short human-readable estimate (e.g. "30 minutes", "2 hours", "1 day")`
  );
}

// POST /api/plan  { goal: string }  ->  { tasks: [{task, priority, estimatedTime}, ...] }
app.post("/api/plan", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY. Did you create a .env file from .env.example?");
      return res.status(500).json({
        error: "Server is missing its Gemini API key. Please contact the site owner.",
      });
    }

    const goal = typeof req.body?.goal === "string" ? req.body.goal.trim() : "";

    if (!goal) {
      return res.status(400).json({ error: "Please provide a goal to plan for." });
    }

    if (goal.length > MAX_GOAL_LENGTH) {
      return res.status(400).json({
        error: `Please keep your goal under ${MAX_GOAL_LENGTH} characters.`,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let geminiResponse;
    try {
      geminiResponse = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(goal) }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.4,
          },
        }),
        signal: controller.signal,
      });
    } catch (networkErr) {
      if (networkErr.name === "AbortError") {
        return res.status(504).json({
          error: "The request to Gemini timed out. Please try again.",
        });
      }
      console.error("Network error calling Gemini:", networkErr);
      return res.status(502).json({
        error: "Couldn't reach the Gemini API. Check your internet connection and try again.",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!geminiResponse.ok) {
      let details = "";
      try {
        const errBody = await geminiResponse.json();
        details = errBody?.error?.message || "";
      } catch {
        // ignore - body wasn't JSON
      }
      console.error(`Gemini API error (${geminiResponse.status}): ${details}`);

      if (geminiResponse.status === 400 && /API key/i.test(details)) {
        return res.status(500).json({
          error: "The Gemini API key on the server appears to be invalid.",
        });
      }
      if (geminiResponse.status === 429) {
        return res.status(429).json({
          error: "Gemini's rate limit was hit. Please wait a moment and try again.",
        });
      }
      return res.status(502).json({
        error: "Gemini API returned an error while generating your plan.",
      });
    }

    const data = await geminiResponse.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("Unexpected Gemini response shape:", JSON.stringify(data));
      return res.status(502).json({
        error: "Gemini returned an empty response. Please try again.",
      });
    }

    let tasks;
    try {
      tasks = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini output as JSON:", rawText);
      return res.status(502).json({
        error: "Gemini's response wasn't valid JSON. Please try again.",
      });
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(502).json({
        error: "Gemini didn't return any tasks for that goal. Try rephrasing it.",
      });
    }

    return res.json({ tasks });
  } catch (err) {
    // Catch-all so an unexpected bug never leaves the client hanging.
    console.error("Unexpected error in /api/plan:", err);
    return res.status(500).json({
      error: "Something unexpected went wrong on the server. Please try again.",
    });
  }
});

// Simple health check, handy for confirming the server + .env are set up correctly
app.get("/api/health", (req, res) => {
  res.json({ ok: true, apiKeyConfigured: Boolean(GEMINI_API_KEY) });
});

app.listen(PORT, () => {
  console.log(`Smart Task Planner running at http://localhost:${PORT}`);
  if (!GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.");
  }
});
