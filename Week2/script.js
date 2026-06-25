// ===== Element references =====
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const notification = document.getElementById("notification");

// ===== State =====
// Each task: { id: number, text: string, completed: boolean }
let tasks = [];
let nextId = 1;
let notificationTimeout = null;

// ===== Notifications =====
function showNotification(message, type) {
  clearTimeout(notificationTimeout);
  notification.textContent = message;
  notification.className = `notification ${type} show`;

  notificationTimeout = setTimeout(() => {
    notification.classList.remove("show");
  }, 2500);
}

// ===== Helpers =====
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function updateEmptyState() {
  emptyState.style.display = tasks.length === 0 ? "block" : "none";
}

// ===== Rendering =====
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

// ===== Task operations =====
function addTask(text) {
  tasks.push({ id: nextId++, text, completed: false });
  renderTasks();
  showNotification("Task added successfully", "success");
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

// ===== Event listeners =====

// Add task (with validation)
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

// Clear error style as soon as the user starts typing again
taskInput.addEventListener("input", () => {
  taskInput.classList.remove("task-input-error");
});

// Delegate clicks for checkbox / edit / delete / save / cancel
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

// ===== Initial render =====
renderTasks();
