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

    const span = document.createElement("span");
    span.textContent = `${task.name} (${task.day})`;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
    // חיבור של הDOM
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



