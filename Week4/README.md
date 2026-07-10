# Week 4: Final Project — Finance Tracker Website

This is the final project for the **Agentic AI Enabled Website** course.

You will build a **Finance Tracker** — a multi-page website where users can log income and expenses, view their spending, and get AI-powered financial advice using the Gemini API.

---

## What you need to build

Your website must have these pages (separate `.html` files inside the `public/` folder):

| Page | File | What it does |
|---|---|---|
| Home / Landing | `index.html` | Introduction to the app, link to dashboard |
| Dashboard | `dashboard.html` | Shows balance, total income, total expenses, recent transactions |
| Add Transaction | `add-transaction.html` | Form to add a new income or expense |
| History | `history.html` | Full list of all transactions with a delete button per row |
| Reports | `reports.html` | Chart of spending by category + AI spending insights button |
| AI Assistant | `assistant.html` | Chatbot where user can ask finance questions |
| Settings | `settings.html` | Monthly budget goal, dark mode toggle, reset data button |

---

## Files already provided (do not edit these)

```
Week4/
├── server.js              ← runs the server and talks to Gemini (DO NOT EDIT)
├── package.json           ← project config (DO NOT EDIT)
├── .env.example           ← copy this to .env and paste your API key
└── public/
    ├── css/
    │   └── style.css      ← base styles, use these classes in your HTML
    └── js/
        ├── storage.js     ← all functions for saving/loading data
        └── ai.js          ← askAI() function for calling Gemini
```

**Your HTML files go in the `public/` folder.**

---

## Setup (do this first)

1. Make sure Node.js is installed (you set this up in Week 3).

2. Open a terminal inside the `Week4` folder and run:
   ```
   npm install
   ```

3. Copy `.env.example` to a new file called `.env`, then paste your Gemini API key:
   ```
   GEMINI_API_KEY="your-key-here"
   ```
   Get your key from: https://aistudio.google.com/

4. Start the server:
   ```
   npm start
   ```

5. Open your browser and go to: **http://localhost:3000**

Every time you save an HTML/CSS/JS file, just refresh the browser — you do not need to restart the server. Only restart if you edit `server.js`.

---

## How to use storage.js

Include this in **every** HTML page:
```html
<script src="js/storage.js"></script>
```

Then call these functions from your own `<script>` tags:

```js
// Get all transactions (returns an array)
getTransactions()

// Add a new transaction
addTransaction({
  description: "Lunch",
  amount: 150,
  type: "expense",        // "expense" or "income"
  category: "Food",
  date: "2025-07-01"
})

// Delete a transaction by id
deleteTransaction(id)

// Delete everything (for the reset button)
clearTransactions()

// Get current balance (income - expenses)
getBalance()

// Get total income only
getTotalIncome()

// Get total expenses only
getTotalExpenses()

// Get expenses grouped by category (useful for charts)
// Returns: { Food: 1200, Rent: 8000, Transport: 400 }
getCategoryTotals()

// Get saved settings (budget, currency, darkMode)
getSettings()

// Save settings
saveSettings({ budget: 5000, currency: "₹", darkMode: true })
```

---

## How to use ai.js

Include this in pages that need AI (Reports and AI Assistant):
```html
<script src="js/storage.js"></script>
<script src="js/ai.js"></script>
```

Then call `askAI()` — it is **async** so use `await`:

```js
// Basic usage
const reply = await askAI("How can I save money on food?");
console.log(reply);

// With transaction data built into the prompt
const totals = getCategoryTotals();
const balance = getBalance();
const reply = await askAI(
  `My balance is ₹${balance}. My spending by category is: ${JSON.stringify(totals)}.
   Give me 3 tips to help me save more money.`
);
```

---

## How to draw a chart (Reports page)

Load Chart.js from a CDN — add this to the `<head>` of your reports page:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

Then in your `<script>`:
```js
const totals = getCategoryTotals();

new Chart(document.getElementById("myChart"), {
  type: "pie",   // or "bar", "doughnut"
  data: {
    labels: Object.keys(totals),
    datasets: [{
      data: Object.values(totals),
      backgroundColor: ["#2a6e48", "#e06060", "#f0a500", "#4c9af0", "#a040b8"]
    }]
  }
});
```

And in your HTML:
```html
<canvas id="myChart"></canvas>
```

---


---

## Tips

- Build one page at a time — start with `add-transaction.html` so you have data to display on the others.
- Test that data shows up across pages after a browser refresh — that confirms localStorage is working.
- Never share or commit your `.env` file — it contains your secret API key.
- If the AI is not responding, check that `npm start` is still running in the terminal.
- Make it look like **your** app — change the colours, fonts, and add your own ideas.

---

## Submission

Once your project is complete, submit it by filling out this form:

**Submission Form:** Will be shared in group

Your submission must include the following:

| Field | What to fill |
|---|---|
| **Name** | Your full name |
| **GitHub Profile Link** | e.g. `https://github.com/your-username` |
| **Project Repo Link** | Link to your forked/uploaded repo with the Week 4 folder |


### Checklist before submitting
- [ ] All 7 HTML pages are built and working
- [ ] Transactions save and persist after a browser refresh
- [ ] At least one chart is visible on the Reports page
- [ ] AI Insights and AI Assistant both return responses
- [ ] `.env` file is NOT uploaded to GitHub (only `.env.example`)
- [ ] The site has your own design touches — not just the default starter styles

