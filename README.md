# Kodejam

A visual design-to-code tool that combines an infinite canvas with AI-powered code generation. Sketch wireframes, capture screenshots of your app, annotate them, and let AI build the code.

## Features

- **Infinite Canvas** - Draw wireframes, add sticky notes, and organize your design using Excalidraw
- **AI Chat** - Ask questions about your codebase, request code changes, and get context-aware assistance
- **Screenshot Capture** - Connect to your dev server and capture live screenshots of your app views
- **Annotation Flow** - Annotate screenshots with arrows, notes, and drawings, then ask AI to fix what you see
- **Build from Design** - Select shapes on the canvas and let AI generate implementation code
- **Canvas History** - Browse and restore previous canvas states
- **Project Settings** - Configure dev server URL, canvas background color, and more

## Getting Started

### Prerequisites

- Node.js 18+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed
- Playwright browsers: `npx playwright install chromium`

### Installation

```bash
git clone <repo-url>
cd kodejam
npm install
```

### Development

```bash
npm run dev
```

This starts both the frontend (http://localhost:5173) and backend (http://localhost:3001).

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
- Request screenshots: "Show me the login page"
- Ask for code changes: "Add a dark mode toggle to the navbar"
- Build from selection: Select shapes, click Build, refine the prompt, then send

### Screenshots

1. Set your dev server URL in Settings
2. Start your app's dev server
3. In the chat, ask "Show me the homepage" or similar
4. Screenshots appear on the canvas in a flow layout with descriptions and arrows

## Tech Stack

- **Frontend**: React 18, Excalidraw, Zustand, Tailwind CSS, Vite
- **Backend**: Express, better-sqlite3, Playwright
- **AI**: Claude Code CLI (spawned as subprocess)

## Project Structure

```
kodejam/
  frontend/          # Vite + React + Excalidraw application
    src/
      canvas/        # Canvas shapes, tools, and UI
      components/    # Layout, Sidebar, Toolbar
      features/      # AI chat, build, project settings, history
      stores/        # Zustand state management
      services/      # API client
  backend/           # Express + SQLite server
    src/
      routes/        # API endpoints (projects, chat, build, history)
      db.ts          # Database schema and migrations
```

## License

Private
