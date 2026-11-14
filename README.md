# Task Manager — Vanilla JavaScript

A responsive task manager built with HTML, CSS, and vanilla JavaScript. This project explores DOM manipulation, events, array methods, immutable updates, and saving data in the browser.

## Live Demo

[Try Task Manager](https://danny-task-manager.netlify.app/)

## Features

- Add tasks and reject empty titles
- Mark tasks complete or incomplete
- Delete tasks
- Switch between all tasks and unfinished tasks
- Keep the selected filter after changes
- Display the number of unfinished tasks and an empty state
- Save tasks with `localStorage` and restore them after a refresh
- Recover from unreadable or invalid saved data using example tasks
- Use labeled checkboxes, keyboard focus styles, and accessible filter buttons
- Responsive styling without external fonts, icon libraries, or dependencies

## Built With

- **HTML5** — semantic page structure and forms
- **CSS3** — custom properties, Flexbox, responsive sizing, and interaction states
- **JavaScript** — DOM manipulation, event listeners, `.find()`, `.filter()`, `.map()`, and spread syntax
- **Web Storage API** — local persistence with JSON serialization

## Run Locally

Open this folder in Visual Studio Code and launch `index.html` with Live Server.

Alternatively, with Python installed:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser. No build command or dependency installation is needed.

`app.js` runs in the browser and uses `document` and `localStorage`. Running `node app.js` directly will not work.

## Checks

With Node.js installed, run:

```bash
node --check app.js
node --test tests/app.test.cjs
```

The tests use a lightweight simulated DOM and storage to check task operations, form and filter events, persistence, and recovery from invalid data. They do not replace visual or real-browser testing.

Before publishing, also check the page on a narrow screen, navigate the controls with Tab, and verify that tasks survive a refresh.

## Deploy to Netlify

Connect this repository to a Netlify project using:

| Setting           | Value       |
| ----------------- | ----------- |
| Production branch | `main`      |
| Base directory    | Leave empty |
| Build command     | Leave empty |
| Publish directory | `.`         |

The included `netlify.toml` sets the publish directory. With continuous deployment enabled, pushes to `main` trigger a deployment.

## Project Structure

```text
.
├── index.html
├── styles.css
├── app.js
├── netlify.toml
├── tests/
│   └── app.test.cjs
├── .gitignore
└── README.md
```

## Learning Notes

The JavaScript is organized into data and settings, DOM selections, task functions, rendering, event listeners, and startup.

Task changes use new arrays rather than mutating the existing array. Toggling a task also creates a new object for that task. Rendering uses `textContent`, so task titles are treated as text rather than HTML.

## Storage Limits

Tasks are saved only in the current browser profile and website origin. They do not sync between devices, and clearing browser data removes them. A local preview and a deployed website have separate storage. There is no account system or server-side database.

The next stage of the learning project is a React interface, followed by an Express API and a PostgreSQL database.

## Author

[Danny Evers](https://dannyevers.xyz/) · [GitHub](https://github.com/dannyevers83)
