// --------- Grab elements (Tasks page) ----------
const form = document.getElementById("taskForm");
const nameInput = document.getElementById("taskName");
const daySelect = document.getElementById("taskDay");
const list = document.getElementById("tasksList");
const emptyMsg = document.getElementById("tasksEmpty");

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

  if (tasks.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";

 tasks.forEach((task) => {
  const li = document.createElement("li");

  // אם זו משימה ישנה בלי completed, נתייחס אליה כ-false
  if (typeof task.completed !== "boolean") task.completed = false;

  const span = document.createElement("span");
  span.textContent = `${task.name} (${task.day})`;

  // אם בוצע - לתת קלאס של קו
  if (task.completed) {
    span.classList.add("task-done");
  }

  // קופסה לכפתורים (Done + Delete)
  const actions = document.createElement("div");
  actions.className = "task-actions";

  // כפתור Done/Undo
  const doneBtn = document.createElement("button");
  doneBtn.type = "button";
  doneBtn.className = "btn-small";
  doneBtn.textContent = task.completed ? "Undo" : "Done";
  doneBtn.addEventListener("click", () => toggleTaskCompleted(task.id));

  // כפתור Delete
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "btn-small btn-danger";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", () => deleteTask(task.id));

  actions.appendChild(doneBtn);
  actions.appendChild(delBtn);

  li.appendChild(span);
  li.appendChild(actions);
  list.appendChild(li);
});
}

function renderPlanner() {
  if (!dayCards || dayCards.length === 0) return;

  dayCards.forEach((card) => {
    const day = card.getAttribute("data-day");
    const ul = card.querySelector(".day-tasks");
    const empty = card.querySelector(".muted");

    if (!ul) return;

    ul.innerHTML = "";

    const dayTasks = tasks.filter((t) => t.day === day);

    if (dayTasks.length === 0) {
      if (empty) empty.style.display = "block";
      return;
    }

    if (empty) empty.style.display = "none";

    dayTasks.forEach((t) => {
        const li = document.createElement("li");
        li.textContent = t.name;
        //הופך משימה לגרירה
        li.draggable = true;
        //זיהוי יחודי למשימה
        li.dataset.id = t.id;
        //מופעל בעת גרירת אלמנט
        li.addEventListener("dragstart", (e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(t.id));
        });
        ul.appendChild(li);
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

// --------- Add ----------
function addTask(name, day) {
  tasks.push({
    id: Date.now(),
    name: name,
    day: day,
    completed: false
  });

  saveTasks();
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

    addTask(nameInput.value, daySelect.value);

    nameInput.value = "";
    nameInput.focus();
  });
}

// Initial render
loadTasks();
renderTasks();
renderPlanner();
setupPlannerDropZones();

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

// להריץ פעם אחת בטעינת העמוד
updateHomeStats();




