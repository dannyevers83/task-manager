// ================================================================
// DATA AND SETTINGS
// ================================================================

let tasks = [
  {
    id: 1,
    title: 'Practice JavaScript',
    completed: false,
  },
  {
    id: 2,
    title: 'Build a React component',
    completed: true,
  },
  {
    id: 3,
    title: 'Create my first API',
    completed: false,
  },
];

let nextTaskId = 4;
let showOnlyIncomplete = true;

// ================================================================
// SELECT HTML ELEMENTS
// ================================================================

const taskListElement = document.querySelector('#task-list');
const showAllButton = document.querySelector('#show-all');
const showIncompleteButton = document.querySelector('#show-incomplete');
const taskForm = document.querySelector('#task-form');
const taskTitleInput = document.querySelector('#task-title');
const taskCountElement = document.querySelector('#task-count');
const storageStatusElement = document.querySelector('#storage-status');

// ================================================================
// TASK FUNCTIONS
// ================================================================

function getIncompleteTasks(taskList) {
  return taskList.filter((task) => task.completed === false);
}

function findTaskById(taskList, id) {
  return taskList.find((task) => task.id === id);
}

function deleteTask(taskList, id) {
  return taskList.filter((task) => task.id !== id);
}

function addTask(taskList, id, title) {
  title = title.trim();
  if (title === '') {
    return taskList;
  }
  if (findTaskById(taskList, id)) {
    return taskList;
  }
  const newTask = {
    id: id,
    title: title,
    completed: false,
  };
  return [...taskList, newTask];
}

function toggleTask(taskList, id) {
  return taskList.map((task) => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
}

function saveTasks() {
  try {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    storageStatusElement.textContent = '';
  } catch {
    storageStatusElement.textContent =
      'Your changes could not be saved. Keep this page open to avoid losing them.';
  }
}

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks === null) {
      return;
    }

    const parsedTasks = JSON.parse(savedTasks);

    // Reject incomplete data, including null entries from older practice code.
    const isValid =
      Array.isArray(parsedTasks) &&
      parsedTasks.every(
        (task) =>
          task !== null &&
          typeof task === 'object' &&
          Number.isSafeInteger(task.id) &&
          task.id > 0 &&
          task.id < Number.MAX_SAFE_INTEGER &&
          typeof task.title === 'string' &&
          task.title.trim() !== '' &&
          typeof task.completed === 'boolean',
      );

    if (
      !isValid ||
      new Set(parsedTasks.map((task) => task.id)).size !== parsedTasks.length
    ) {
      throw new Error('Invalid saved tasks');
    }

    tasks = parsedTasks;
  } catch {
    storageStatusElement.textContent =
      'Saved tasks could not be loaded. Showing example tasks instead.';
  }
}

// ================================================================
// RENDER THE INTERFACE
// ================================================================

function renderTasks(taskList) {
  taskListElement.textContent = '';

  if (taskList.length === 0) {
    const listItem = document.createElement('li');
    listItem.className = 'empty-state';
    listItem.textContent = 'No tasks to show';
    taskListElement.appendChild(listItem);
    return;
  }

  for (let i = 0; i < taskList.length; i++) {
    const task = taskList[i];
    const listItem = document.createElement('li');
    listItem.className = task.completed ? 'task-item is-complete' : 'task-item';

    const label = document.createElement('label');
    label.className = 'task-label';

    const checkbox = document.createElement('input');
    checkbox.id = 'task-' + task.id;
    checkbox.className = 'task-checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;

    checkbox.addEventListener('change', function () {
      tasks = toggleTask(tasks, task.id);
      saveTasks();
      renderCurrentTasks();

      // Rendering replaces the controls, so restore keyboard focus afterwards.
      const updatedCheckbox = document.querySelector('#task-' + task.id);
      if (updatedCheckbox) {
        updatedCheckbox.focus();
      } else {
        showIncompleteButton.focus();
      }
    });

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;
    label.appendChild(checkbox);
    label.appendChild(title);
    listItem.appendChild(label);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', 'Delete ' + task.title);

    deleteButton.addEventListener('click', function () {
      tasks = deleteTask(tasks, task.id);
      saveTasks();
      renderCurrentTasks();
      taskTitleInput.focus();
    });
    listItem.appendChild(deleteButton);
    taskListElement.appendChild(listItem);
  }
}

function renderCurrentTasks() {
  const count = getIncompleteTasks(tasks).length;
  taskCountElement.textContent =
    count + (count === 1 ? ' task remaining' : ' tasks remaining');
  showAllButton.setAttribute('aria-pressed', String(!showOnlyIncomplete));
  showIncompleteButton.setAttribute('aria-pressed', String(showOnlyIncomplete));

  if (showOnlyIncomplete) {
    renderTasks(getIncompleteTasks(tasks));
  } else {
    renderTasks(tasks);
  }
}

// ================================================================
// HANDLE BUTTON CLICKS AND FORM SUBMISSIONS
// ================================================================

showAllButton.addEventListener('click', function () {
  showOnlyIncomplete = false;
  renderCurrentTasks();
});

showIncompleteButton.addEventListener('click', function () {
  showOnlyIncomplete = true;
  renderCurrentTasks();
});

taskForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const title = taskTitleInput.value.trim();

  if (!title) {
    return;
  }

  tasks = addTask(tasks, nextTaskId, title);
  nextTaskId++;
  saveTasks();

  renderCurrentTasks();
  taskForm.reset();
  taskTitleInput.focus();
});

// ================================================================
// START THE APP
// ================================================================

loadTasks();

nextTaskId = 1;
for (let i = 0; i < tasks.length; i++) {
  if (tasks[i].id >= nextTaskId) {
    nextTaskId = tasks[i].id + 1;
  }
}

renderCurrentTasks();
