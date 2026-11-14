const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = join(__dirname, '..');
const source = readFileSync(join(root, 'app.js'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');

// Simulate the small part of the browser API used by this app.
function startApp(options = {}) {
  const storage = new Map();
  if (options.saved !== undefined) storage.set('tasks', options.saved);

  const elements = new Map();
  const document = { activeElement: null };

  class Element {
    constructor() {
      this.children = [];
      this.attributes = {};
      this.listeners = {};
      this.value = '';
      this.text = '';
    }

    set textContent(value) {
      this.text = String(value);
      this.children = [];
    }

    get textContent() {
      return (
        this.text + this.children.map((child) => child.textContent).join('')
      );
    }

    appendChild(child) {
      this.children.push(child);
    }

    setAttribute(name, value) {
      this.attributes[name] = String(value);
    }

    addEventListener(name, callback) {
      this.listeners[name] = callback;
    }

    trigger(name) {
      return this.listeners[name]({ preventDefault() {} });
    }

    focus() {
      document.activeElement = this;
    }

    reset() {
      elements.get('task-title').value = '';
    }
  }

  for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
    elements.set(match[1], new Element());
  }

  function findById(element, id) {
    if (element.id === id) return element;
    for (const child of element.children) {
      const found = findById(child, id);
      if (found) return found;
    }
    return null;
  }

  document.createElement = () => new Element();
  document.querySelector = (selector) => {
    const id = selector.slice(1);
    if (elements.has(id)) return elements.get(id);
    return findById(elements.get('task-list'), id);
  };

  const context = vm.createContext({
    document,
    localStorage: {
      getItem(key) {
        if (options.readError) throw new Error('Storage unavailable');
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        if (options.writeError) throw new Error('Storage unavailable');
        storage.set(key, value);
      },
    },
  });

  vm.runInContext(source, context);

  return {
    elements,
    document,
    storage,
    tasks: () => JSON.parse(vm.runInContext('JSON.stringify(tasks)', context)),
    submit(title) {
      elements.get('task-title').value = title;
      elements.get('task-form').trigger('submit');
    },
  };
}

test('initial render and filters show the right tasks and active state', () => {
  const app = startApp();
  const list = app.elements.get('task-list');
  assert.equal(list.children.length, 2);
  assert.equal(app.elements.get('task-count').textContent, '2 tasks remaining');
  app.elements.get('show-all').trigger('click');
  assert.equal(list.children.length, 3);
  assert.equal(app.elements.get('show-all').attributes['aria-pressed'], 'true');
  app.elements.get('show-incomplete').trigger('click');
  assert.equal(list.children.length, 2);
});

test('form trims titles, rejects blanks, and keeps the active filter', () => {
  const app = startApp();
  app.submit('   ');
  assert.equal(app.tasks().length, 3);
  app.submit('  Learn Express  ');
  app.submit('Connect to PostgreSQL');
  assert.deepEqual(app.tasks().slice(3), [
    { id: 4, title: 'Learn Express', completed: false },
    { id: 5, title: 'Connect to PostgreSQL', completed: false },
  ]);
  assert.equal(app.elements.get('task-list').children.length, 4);
  assert.equal(app.elements.get('task-title').value, '');
  assert.equal(JSON.parse(app.storage.get('tasks')).length, 5);
});

test('checkbox changes persist, update the count, and preserve filtering', () => {
  const app = startApp();
  const checkbox = app.document.querySelector('#task-1');
  checkbox.checked = true;
  checkbox.trigger('change');
  assert.equal(app.tasks()[0].completed, true);
  assert.equal(app.elements.get('task-list').children.length, 1);
  assert.equal(app.elements.get('task-count').textContent, '1 task remaining');
  assert.equal(JSON.parse(app.storage.get('tasks'))[0].completed, true);

  app.elements.get('show-all').trigger('click');
  app.document.querySelector('#task-1').trigger('change');
  assert.equal(app.tasks()[0].completed, false);
  assert.equal(app.document.activeElement.id, 'task-1');
});

test('delete removes the chosen task and saves without resetting the filter', () => {
  const app = startApp();
  const row = app.elements.get('task-list').children[0];
  row.children[1].trigger('click');
  assert.deepEqual(
    app.tasks().map((task) => task.id),
    [2, 3],
  );
  assert.equal(app.elements.get('task-list').children.length, 1);
  assert.deepEqual(
    JSON.parse(app.storage.get('tasks')).map((task) => task.id),
    [2, 3],
  );
});

test('saved tasks survive a restart and new IDs do not collide', () => {
  const first = startApp();
  first.submit('A saved task');
  const second = startApp({ saved: first.storage.get('tasks') });
  second.submit('Another task');
  assert.equal(second.tasks()[3].title, 'A saved task');
  assert.equal(second.tasks()[4].id, 5);
});

test('an empty saved array stays empty and can receive a new task', () => {
  const app = startApp({ saved: '[]' });
  assert.deepEqual(app.tasks(), []);
  assert.equal(app.elements.get('task-list').textContent, 'No tasks to show');
  app.submit('Start again');
  assert.equal(app.tasks()[0].id, 1);
});

test('invalid JSON, invalid task entries, and duplicate IDs use sample data', () => {
  for (const saved of [
    '{broken',
    'null',
    '[null]',
    '[{"id":1,"title":"Invalid","completed":"false"}]',
    JSON.stringify([
      { id: 1, title: 'One', completed: false },
      { id: 1, title: 'Duplicate', completed: false },
    ]),
  ]) {
    const app = startApp({ saved });
    assert.equal(app.tasks().length, 3);
    assert.match(
      app.elements.get('storage-status').textContent,
      /could not be loaded/,
    );
  }
});

test('unavailable storage does not stop the interface from working', () => {
  const app = startApp({ readError: true, writeError: true });
  app.submit('Still usable');
  assert.equal(app.tasks().length, 4);
  assert.match(
    app.elements.get('storage-status').textContent,
    /could not be saved/,
  );
});

test('task titles are inserted as text and checkboxes have visible labels', () => {
  const app = startApp();
  app.submit('<img src=x onerror=alert(1)>');
  const row = app.elements.get('task-list').children.at(-1);
  const label = row.children[0];
  assert.equal(label.children[1].textContent, '<img src=x onerror=alert(1)>');
  assert.equal(label.children[0].type, 'checkbox');
  assert.equal(
    row.children[1].attributes['aria-label'],
    'Delete <img src=x onerror=alert(1)>',
  );
});
