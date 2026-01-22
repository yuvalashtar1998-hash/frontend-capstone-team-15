// --------- Grab elements (Tasks page) ----------
const form = document.getElementById("taskForm");
const nameInput = document.getElementById("taskName");
const daySelect = document.getElementById("taskDay");
const list = document.getElementById("tasksList");
const emptyMsg = document.getElementById("tasksEmpty");
const courseInput = document.getElementById("taskCourse");
const filterCourse = document.getElementById("filterCourse");

const dayCards = document.querySelectorAll(".day-card[data-day]");

// --------- In-memory state ----------
const tasks = [];
const STORAGE_KEY = "studyPlannerTasks";

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
// שומר את מערך המשימות בזכרון הדפדפן

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
        tasks.length = 0;
        tasks.push(...data);
}

  } catch (err) {
    // אם יש מידע לא תקין—לא עושים כלום
  }
//   פונקציה שטוענת משימות שמורות לתוך המערך
}


// --------- Render = הצגת מידע ----------
function renderTasks() {
  if (!list) return;

  list.innerHTML = "";

    // --- Filter tasks by course (if user chose a course) ---
  let visibleTasks = tasks;

  if (filterCourse && filterCourse.value !== "all") {
    visibleTasks = tasks.filter(t => (t.course || "").trim() === filterCourse.value);
  }

  if (visibleTasks.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";
  //----שימוש בJQUERY על DOM מתקדם---
  visibleTasks.forEach((task) => {
  // אם זו משימה ישנה בלי completed, נתייחס אליה כ-false
  if (typeof task.completed !== "boolean") task.completed = false;

  const courseLabel = (task.course && task.course.trim()) ? task.course.trim() : "No course";

  // --- jQuery DOM build (בקטנה, בלי לשנות לוגיקה) ---
  const $li = $("<li>");

  const $span = $("<span>").text(`${task.name} | ${courseLabel} | ${task.day}`);
  if (task.completed) $span.addClass("task-done");

  const $actions = $("<div>").addClass("task-actions");

  const $doneBtn = $("<button>")
  .attr("type", "button")
  .attr("aria-label", task.completed ? `Undo task: ${task.name}` : `Mark as done: ${task.name}`)
  .addClass("btn-small")
  .text(task.completed ? "Undo" : "Done")
  .on("click", () => toggleTaskCompleted(task.id));

  const $delBtn = $("<button>")
  .attr("type", "button")
  .attr("aria-label", `Delete task: ${task.name}`)
  .addClass("btn-small btn-danger")
  .text("Delete")
  .on("click", () => deleteTask(task.id));

  $actions.append($doneBtn, $delBtn);
  $li.append($span, $actions);

  $("#tasksList").append($li);
});
}

function renderPlanner() {
  if (!dayCards || dayCards.length === 0) return;

  dayCards.forEach((card) => {
    const day = card.getAttribute("data-day");
    const ul = card.querySelector(".day-tasks");
    const empty = card.querySelector(".no-tasks");

    if (!ul) return;

// ניקוי הרשימה (jQuery)
$(ul).empty();

const dayTasks = tasks.filter((t) => t.day === day);

if (dayTasks.length === 0) {
  if (empty) empty.style.display = "block";
  return;
}

// כשיש משימות
if (empty) empty.style.display = "none";

dayTasks.forEach((t) => {
  const $li = $("<li>").text(t.name);

  $li.attr("draggable", "true");
  $li.attr("data-id", t.id);
  $li.on("dragstart", (e) => {
    const ev = e.originalEvent;
    ev.dataTransfer.effectAllowed = "move";
    ev.dataTransfer.setData("text/plain", String(t.id));
  });
  $(ul).append($li);
});
});
}

//גישה לפעולות מקלדת לPLANNER:
function setupPlannerKeyboardAccessibility() {
  if (!dayCards || dayCards.length === 0) return;

  dayCards.forEach((card) => {
    const day = card.getAttribute("data-day") || "Day";

    // מאפשר להגיע עם TAB
    card.setAttribute("tabindex", "0");

    // תיאור לקורא מסך
    card.setAttribute("role", "region");
    card.setAttribute("aria-label", `Planner day: ${day}`);

    // פידבק ויזואלי (כמו hover)
    card.addEventListener("focus", () => card.classList.add("drag-over"));
    card.addEventListener("blur", () => card.classList.remove("drag-over"));

    // Enter/Space = “הדגשה” בלבד
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.classList.toggle("drag-over");
      }
    });
  });
}

function setupPlannerDropZones() {
  if (!dayCards || dayCards.length === 0) return;

  dayCards.forEach((card) => {
    const day = card.getAttribute("data-day");

    // מאפשר לשחרר בכל מקום בתוך הכרטיס
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();

      const taskId = Number(e.dataTransfer.getData("text/plain"));
      if (!taskId) return;

      moveTaskToDay(taskId, day);
    });
  });
}

function renderWeekDates() {
  if (!dayCards || dayCards.length === 0) return;
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

  const dayOrder = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  dayCards.forEach((card) => {
    const dayName = card.getAttribute("data-day");
    const dateEl = card.querySelector(".day-date");
    if (!dateEl) return;

    const idx = dayOrder.indexOf(dayName);
    if (idx === -1) return;

    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + idx);

    // פורמט תאריך נוח
    const formatted = d.toLocaleDateString("he-IL");
    dateEl.textContent = formatted;
  });
}


function updateCourseFilterOptions() {
  if (!filterCourse) return;

  const current = filterCourse.value || "all";

  // קורסים ייחודיים מתוך המשימות (מתעלמים מריק)
  const uniqueCourses = Array.from(
    new Set(
      tasks
        .map(t => (t.course || "").trim())
        .filter(c => c.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));

  filterCourse.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = "All";
  filterCourse.appendChild(optAll);

  uniqueCourses.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    filterCourse.appendChild(opt);
  });

  // לשמור בחירה אם אפשר
  const stillExists = Array.from(filterCourse.options).some(o => o.value === current);
  filterCourse.value = stillExists ? current : "all";
}


// --------- Add ----------
function addTask(name, day, course) {
  tasks.push({
    id: Date.now(),
    name: name,
    day: day,
    course: course,
    completed: false
  });

saveTasks();
updateCourseFilterOptions();
renderTasks();
renderPlanner();
}

// --------- Delete ----------
function deleteTask(id) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return;

  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
  renderPlanner();
}

function toggleTaskCompleted(taskId){
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  // אם אין completed במשימות ישנות, נתחיל מ-false
  if (typeof task.completed !== "boolean") task.completed = false;

  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

// --------- Move ----------
function moveTaskToDay(taskId, newDay) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  task.day = newDay;

  saveTasks();
  renderTasks();
  renderPlanner();
}

// --------- Events ----------
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    addTask(
      nameInput.value.trim(),
      daySelect.value,
      (courseInput?.value || "").trim()
    );

    nameInput.value = "";
    if (courseInput) courseInput.value = "";
    nameInput.focus();
  });
}

if (filterCourse) {
  filterCourse.addEventListener("change", () => {
    renderTasks();
  });
}

// Initial render
loadTasks();
updateCourseFilterOptions();
renderTasks();
renderPlanner();
setupPlannerDropZones();
renderWeekDates();
setupPlannerKeyboardAccessibility();

//  Home stats 
function getTodayDayName() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

function loadTasksForStats() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function updateHomeStats() {
  const elToday = document.getElementById("statToday");
  const elPending = document.getElementById("statPending");
  const elCompleted = document.getElementById("statCompleted");
  const elTotal = document.getElementById("statTotal");

  // אם אנחנו לא בעמוד הבית (אין את האלמנטים) — לא עושים כלום
  if (!elToday || !elPending || !elCompleted || !elTotal) return;

  const all = loadTasksForStats();
  const todayName = getTodayDayName();

  const total = all.length;
  const todayCount = all.filter(t => t.day === todayName).length;

  elTotal.textContent = total;
  elToday.textContent = todayCount;
//סופר משימות שבוצעו כשנלחץ DONE
  const completedCount = all.filter(t => t.completed === true).length;
  const pendingCount = all.filter(t => t.completed !== true).length;

  elCompleted.textContent = completedCount;
  elPending.textContent = pendingCount;

}

updateHomeStats();

// ===== Mobile Hamburger Menu =====
const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");

if (navToggle && mainNav){
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}