// =========================================================
// Element references
// =========================================================
const goalForm = document.getElementById("goalForm");
const goalInput = document.getElementById("goalInput");
const generateBtn = document.getElementById("generateBtn");
const plannerLoading = document.getElementById("plannerLoading");
const plannerError = document.getElementById("plannerError");
const planResults = document.getElementById("planResults");
const stepList = document.getElementById("stepList");
const addAllBtn = document.getElementById("addAllBtn");

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const notification = document.getElementById("notification");

// =========================================================
// State
// =========================================================
// Each task: { id: number, text: string, completed: boolean }
let tasks = [];
let nextId = 1;
let notificationTimeout = null;

// The most recently generated plan steps, so "Add all" / per-step
// "Add" buttons know what to push into the task list.
let currentSteps = [];

// =========================================================
// Notifications
// =========================================================
function showNotification(message, type) {
  clearTimeout(notificationTimeout);
  notification.textContent = message;
  notification.className = `notification ${type} show`;

  notificationTimeout = setTimeout(() => {
    notification.classList.remove("show");
  }, 2500);
}

// =========================================================
// Helpers
// =========================================================
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function updateEmptyState() {
  emptyState.style.display = tasks.length === 0 ? "block" : "none";
}

function priorityClass(priority) {
  const normalized = String(priority || "").trim().toLowerCase();
  if (normalized === "high") return "priority-high";
  if (normalized === "low") return "priority-low";
  return "priority-medium";
}

// =========================================================
// Task Manager rendering (Week 2, unchanged in behaviour)
// =========================================================
function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item${task.completed ? " completed" : ""}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} aria-label="Mark task complete" />
      <span class="task-text">${escapeHTML(task.text)}</span>
      <div class="task-actions">
        <button type="button" class="edit-btn">Edit</button>
        <button type="button" class="delete-btn">Delete</button>
      </div>
    `;

    taskList.appendChild(li);
  });

  updateEmptyState();
}

// =========================================================
// Task operations
// =========================================================
function addTask(text, { silent = false } = {}) {
  tasks.push({ id: nextId++, text, completed: false });
  renderTasks();
  if (!silent) showNotification("Task added successfully", "success");
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  renderTasks();
  showNotification("Task deleted", "success");
}

function toggleComplete(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) task.completed = !task.completed;
  renderTasks();
}

function startEdit(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const li = taskList.querySelector(`li[data-id="${id}"]`);
  if (!li) return;

  li.innerHTML = `
    <input type="text" class="task-edit-input" value="${escapeHTML(task.text)}" maxlength="100" />
    <div class="task-actions">
      <button type="button" class="save-btn">Save</button>
      <button type="button" class="cancel-btn">Cancel</button>
    </div>
  `;

  const editInput = li.querySelector(".task-edit-input");
  editInput.focus();
  editInput.select();

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      saveEdit(id, editInput.value);
    } else if (e.key === "Escape") {
      renderTasks();
    }
  });
}

function saveEdit(id, newText) {
  const trimmed = newText.trim();

  if (!trimmed) {
    showNotification("Task cannot be empty", "error");
    return;
  }

  const task = tasks.find((t) => t.id === id);
  if (task) task.text = trimmed;

  renderTasks();
  showNotification("Task updated successfully", "success");
}

// =========================================================
// Task Manager event listeners
// =========================================================
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = taskInput.value.trim();

  if (!value) {
    taskInput.classList.add("task-input-error");
    showNotification("Please enter a task before adding", "error");
    taskInput.focus();
    return;
  }

  taskInput.classList.remove("task-input-error");
  addTask(value);
  taskInput.value = "";
  taskInput.focus();
});

taskInput.addEventListener("input", () => {
  taskInput.classList.remove("task-input-error");
});

taskList.addEventListener("click", (e) => {
  const li = e.target.closest(".task-item");
  if (!li) return;

  const id = Number(li.dataset.id);

  if (e.target.classList.contains("task-checkbox")) {
    toggleComplete(id);
  } else if (e.target.classList.contains("delete-btn")) {
    deleteTask(id);
  } else if (e.target.classList.contains("edit-btn")) {
    startEdit(id);
  } else if (e.target.classList.contains("save-btn")) {
    const input = li.querySelector(".task-edit-input");
    saveEdit(id, input.value);
  } else if (e.target.classList.contains("cancel-btn")) {
    renderTasks();
  }
});

// =========================================================
// Smart Planner: rendering
// =========================================================
function renderSteps(steps) {
  stepList.innerHTML = "";

  steps.forEach((step, index) => {
    const li = document.createElement("li");
    li.className = "step-item";
    li.dataset.index = index;

    li.innerHTML = `
      <div class="step-body">
        <div class="step-name">${escapeHTML(step.task)}</div>
        <div class="step-meta">
          <span class="priority-badge ${priorityClass(step.priority)}">${escapeHTML(step.priority || "Medium")}</span>
          <span class="step-time">⏱ ${escapeHTML(step.estimatedTime || "—")}</span>
        </div>
      </div>
      <button type="button" class="step-add-btn">Add</button>
    `;

    stepList.appendChild(li);
  });
}

function showPlannerError(message) {
  plannerError.textContent = message;
  plannerError.hidden = false;
}

function hidePlannerError() {
  plannerError.hidden = true;
  plannerError.textContent = "";
}

function setPlannerLoading(isLoading) {
  plannerLoading.hidden = !isLoading;
  generateBtn.disabled = isLoading;
  generateBtn.textContent = isLoading ? "Generating..." : "Generate Plan";
}

// =========================================================
// Smart Planner: fetching from our backend (/api/plan),
// which in turn calls the Gemini API using the key stored
// server-side in .env — the key never reaches the browser.
// =========================================================
async function generatePlan(goal) {
  const response = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal }),
  });

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    throw new Error("The server sent back a response we couldn't understand. Please try again.");
  }

  if (!response.ok) {
    throw new Error(data?.error || "Something went wrong while generating your plan.");
  }

  if (!Array.isArray(data.tasks) || data.tasks.length === 0) {
    throw new Error("Gemini didn't return any tasks for that goal. Try rephrasing it.");
  }

  return data.tasks;
}

goalForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const goal = goalInput.value.trim();
  hidePlannerError();
  planResults.hidden = true;

  if (!goal) {
    showPlannerError("Please describe a goal before generating a plan.");
    goalInput.focus();
    return;
  }

  setPlannerLoading(true);

  try {
    const steps = await generatePlan(goal);
    currentSteps = steps;
    renderSteps(steps);
    planResults.hidden = false;
  } catch (err) {
    // Covers network failures (server unreachable), non-2xx
    // responses from our backend, and malformed Gemini output.
    console.error("Plan generation failed:", err);
    showPlannerError(
      err.message || "Couldn't reach the planning service. Please check your connection and try again."
    );
  } finally {
    setPlannerLoading(false);
  }
});

// Add a single generated step to the task list
stepList.addEventListener("click", (e) => {
  if (!e.target.classList.contains("step-add-btn")) return;

  const li = e.target.closest(".step-item");
  const index = Number(li.dataset.index);
  const step = currentSteps[index];
  if (!step) return;

  addTask(step.task, { silent: true });
  e.target.textContent = "Added";
  e.target.disabled = true;
  showNotification("Step added to your tasks", "success");
});

// Add every generated step to the task list at once
addAllBtn.addEventListener("click", () => {
  if (currentSteps.length === 0) return;

  currentSteps.forEach((step) => addTask(step.task, { silent: true }));

  stepList.querySelectorAll(".step-add-btn").forEach((btn) => {
    btn.textContent = "Added";
    btn.disabled = true;
  });

  showNotification(`Added ${currentSteps.length} steps to your tasks`, "success");
});

// =========================================================
// Initial render
// =========================================================
renderTasks();
