# Kodejam

A visual frontend for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Sketch wireframes on an infinite canvas, chat with AI about your codebase, and ship working code — all from a single tool.

**[oskarglauser.github.io/kodejam](https://oskarglauser.github.io/kodejam/)**

## How It Works

1. **Create a project** pointing at a local codebase
2. **Sketch wireframes** and add sticky notes on the canvas
3. **Chat with Claude** to describe what you want built — Claude reads your codebase for context
4. **Select shapes** on the canvas to give Claude visual context before chatting
5. **Review a build plan**, then let Claude write code directly into your repo
6. **Capture live screenshots** from your running dev server and annotate them on the canvas

## Features

- **Infinite Canvas** — Draw wireframes, sticky notes, arrows, text, and freehand using Excalidraw
- **AI Chat (per page)** — Each page has its own chat thread with Claude, with full codebase awareness
- **Build from Design** — Select shapes, generate a build plan, review it, then execute against your repo
- **Screenshot Capture** — Connect to your dev server and capture screenshots directly onto the canvas
- **Annotation Flow** — Annotate screenshots with arrows, notes, and drawings, then ask Claude to implement what you've sketched
- **Pages & Sidebar** — Organize screens and flows into separate pages within a project
- **Canvas History** — Browse previous canvas states with automatic snapshots
- **Project Settings** — Configure dev server URL, canvas background color, and project path
- **CLAUDE.md Support** — Add a `CLAUDE.md` to your repo to customize AI behavior per-project

## Getting Started

### Prerequisites

- Node.js 18+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and on your PATH
- Playwright browsers: `npx playwright install chromium`

### Installation

```bash
git clone https://github.com/oskarglauser/kodejam.git
cd kodejam
npm install
```

### Development

```bash
npm run dev
```

This starts both the frontend and backend concurrently. Open the URL printed by Vite in your browser.

You can also run them separately:

```bash
npm run dev:frontend   # Vite dev server
npm run dev:backend    # Express API server
```

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_BINARY` | `claude` | Path to the Claude Code CLI binary |

## Usage

### Canvas Tools

| Key | Tool | Description |
|-----|------|-------------|
| `V` | Select | Select and move elements |
| `H` | Hand | Pan the canvas |
| `B` | Wireframe | Add a dashed wireframe box with label |
| `N` | Note | Add a sticky note |
| `D` | Draw | Freehand drawing |
| `A` | Arrow | Draw arrows between elements |
| `T` | Text | Add text labels |
| `E` | Eraser | Erase elements |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+A` | Select all |
| `Delete` | Delete selected |
| `Ctrl+D` | Duplicate |
| `Ctrl+C` / `Ctrl+V` | Copy & paste |
| `Scroll` | Zoom in/out |
| `Space+Drag` | Pan canvas |

### AI Chat

Each page has its own chat thread. Open the chat panel from the toolbar and try:

- Ask questions about your codebase
- Request code changes: *"Add a dark mode toggle to the navbar"*
- Request screenshots: *"Show me the login page"* (requires dev server URL)
- Build from selection: select shapes on the canvas, click Build, review the plan, then proceed

### Screenshots

1. Set your dev server URL in project settings (gear icon)
2. Start your app's dev server
3. Click the camera icon in the canvas toolbar, or ask in chat: *"Show me the homepage"*
4. Screenshots appear on the canvas in a flow layout with descriptions and arrows
5. Annotate them and ask Claude to implement changes

### Tips

- Double-click the project name in the toolbar to rename it
- Double-click a page in the sidebar to rename it
- Right-click a page for rename/delete options
- Select shapes before chatting to give Claude visual context about what you're working on
- Add a `CLAUDE.md` file to your project repo to customize Claude's behavior

## Tech Stack

- **Frontend**: React 18, Excalidraw, Zustand, Tailwind CSS, Vite
- **Backend**: Express, better-sqlite3, Playwright
- **AI**: Claude Code CLI (spawned as subprocess with SSE streaming)
- **Landing Page**: React, Tailwind CSS, Vite (builds to `docs/` for GitHub Pages)

## Project Structure

```
kodejam/
  frontend/          # Vite + React + Excalidraw application
    src/
      canvas/        # Canvas component, custom shapes, toolbar, persistence
      components/    # Layout, Sidebar, Toolbar, UI primitives (button, input, modal, etc.)
      features/      # AI chat, build, project settings, history, screenshots
      stores/        # Zustand state management (project, UI)
      services/      # API client
  backend/           # Express + SQLite server
    src/
      routes/        # API endpoints (projects, pages, chat, build, history, screenshots)
      db.ts          # Database schema and migrations
  landing/           # GitHub Pages landing site
  docs/              # Built landing page (committed for GitHub Pages)
```

## License

MIT
