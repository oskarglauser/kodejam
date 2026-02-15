# Kodejam

A visual frontend for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Sketch wireframes on an infinite canvas, chat with AI about your codebase, and ship working code.

**[oskarglauser.github.io/kodejam](https://oskarglauser.github.io/kodejam/)**

## Features

- **Infinite Canvas** — Draw wireframes, add sticky notes, and organize your design using Excalidraw
- **AI Chat** — Ask questions about your codebase, request code changes, and get context-aware assistance powered by Claude Code
- **Build from Design** — Select shapes on the canvas and let AI generate a build plan, then execute it against your repo
- **Screenshot Capture** — Connect to your dev server and capture live screenshots of your app views
- **Annotation Flow** — Annotate screenshots with arrows, notes, and drawings, then ask AI to fix what you see
- **Canvas History** — Browse and restore previous canvas states
- **CLAUDE.md Support** — Add a `CLAUDE.md` to your project repo to customize AI behavior per-project

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

This starts both the frontend (http://localhost:5173) and backend (http://localhost:3001).

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_BINARY` | `claude` | Path to the Claude Code CLI binary |

### Create a Project

1. Open http://localhost:5173
2. Enter a project name and the path to your local git repository
3. Optionally set a dev server URL (e.g., `http://localhost:3000`) for screenshot capture
4. Click "Create Project"

## Usage

### Canvas

- Press **B** to draw wireframe boxes
- Press **N** to add sticky notes
- Press **/** to open the AI chat
- Select shapes and click **Build** to generate code from your design
- Double-click pages in the sidebar to rename them
- Double-click the project name in the toolbar to rename it

### AI Chat

- Ask questions about your codebase
- Request screenshots: *"Show me the login page"*
- Ask for code changes: *"Add a dark mode toggle to the navbar"*
- Build from selection: Select shapes, click Build, review the plan, then proceed

### Screenshots

1. Set your dev server URL in project Settings
2. Start your app's dev server
3. In the chat, ask "Show me the homepage" or similar
4. Screenshots appear on the canvas in a flow layout with descriptions and arrows

### Customizing AI Behavior

Add a `CLAUDE.md` file to your project repository root. The Claude Code CLI reads it automatically and applies your instructions to all chat and build operations. Use it for project-specific conventions, tech stack preferences, or coding guidelines.

## Tech Stack

- **Frontend**: React 18, Excalidraw, Zustand, Tailwind CSS, shadcn/ui, Vite
- **Backend**: Express, better-sqlite3, Playwright
- **AI**: Claude Code CLI (spawned as subprocess)
- **Landing Page**: React, Tailwind CSS, Vite (builds to `docs/` for GitHub Pages)

## Project Structure

```
kodejam/
  frontend/          # Vite + React + Excalidraw application
    src/
      canvas/        # Canvas shapes, tools, and UI
      components/    # Layout, Sidebar, Toolbar, shadcn ui components
      features/      # AI chat, build, project settings, history
      stores/        # Zustand state management
      services/      # API client
      lib/           # Utilities (cn, etc.)
  backend/           # Express + SQLite server
    src/
      routes/        # API endpoints (projects, chat, build, history)
      db.ts          # Database schema and migrations
  landing/           # GitHub Pages landing site
  docs/              # Built landing page (committed for GitHub Pages)
```

## License

MIT
