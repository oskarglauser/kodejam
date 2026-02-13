# Kodejam - Claude Code Instructions

## Project Overview

Kodejam is a visual design-to-code tool built with Excalidraw, React, and an Express backend. Users sketch wireframes, annotate screenshots, and use AI chat to generate and refine code connected to a git repository.

## Architecture

- **Monorepo** with `frontend/` and `backend/` workspaces
- **Frontend**: Vite + React 18 + Excalidraw + Zustand + Tailwind CSS (port 5173)
- **Backend**: Express + better-sqlite3 + Playwright + Claude Code CLI (port 3001)
- Frontend proxies `/api` to backend via Vite config

## Development

```bash
npm run dev          # Start both frontend and backend
npm run dev:frontend # Frontend only (Vite, port 5173)
npm run dev:backend  # Backend only (tsx watch, port 3001)
```

## Key Patterns

### Excalidraw Patterns
- Canvas uses `<Excalidraw>` component with `excalidrawAPI` callback for imperative access
- Custom shapes use standard Excalidraw elements (rectangle, image, text) with `customData` property to tag Kodejam types (e.g., `customData: { kodejam: 'wireframe-box', label }`)
- Create elements via `convertToExcalidrawElements()` + `api.updateScene({ elements: [...existing, ...new] })`
- Scene persistence format: `{ version: 2, type: 'excalidraw', elements, files }`
- Images require `BinaryFileData` with `dataURL` — use `getDataURL(blob)` to convert
- Tool switching: `excalidrawAPI.setActiveTool({ type: 'rectangle' | 'arrow' | ... })`
- Zoom to fit: `excalidrawAPI.scrollToContent(elements, { fitToContent: true })`
- Selection tracking: read `appState.selectedElementIds` from `onChange` callback
- **Stable onChange**: Use refs for callbacks passed to `onChange` to prevent render loops (empty dependency array on the useCallback)

### Claude Code CLI Spawning
- Binary path: `/Users/oskarglauser/.local/bin/claude`
- Spawn via `bash -c '... < /dev/null'` with `stdio: ['ignore', 'pipe', 'pipe']` - stdin must NOT be a pipe or it hangs
- Use `--output-format stream-json --verbose` for streaming
- **SSE disconnect**: Use `res.on('close')` NOT `req.on('close')` in Express SSE handlers

### SSE Streaming
- Chat and build endpoints use Server-Sent Events for real-time streaming
- Claude Code CLI stream-json events are forwarded to the client
- Screenshot commands are parsed from Claude's response after stream ends

### State Management
- `projectStore` (Zustand): Projects, pages, CRUD operations
- `uiStore` (Zustand): UI state (chat open, history open, view mode)
- Canvas state auto-persists via `useCanvasPersistence` hook

## Database

SQLite database (`kodejam.db`) with tables:
- `projects` - Project metadata and settings (JSON column)
- `pages` - Pages within projects, stores canvas snapshots
- `builds` - Build plans and execution results
- `ai_threads` - Chat conversation history per page
- `canvas_history` - Canvas state snapshots for undo/history

## File Structure

```
frontend/src/
  canvas/           # Excalidraw canvas, custom toolbar, persistence, UI
  components/       # Layout, Sidebar, Toolbar
  features/
    ai/             # ChatPanel, BuildPlanOverlay, useAIChat, useBuild
    project/        # ProjectSetup, ProjectSettingsModal
    history/        # HistoryPanel
  services/api.ts   # API client
  stores/           # Zustand stores
  types/            # TypeScript types

backend/src/
  index.ts          # Express server setup
  db.ts             # SQLite connection and migrations
  routes/
    projects.ts     # Projects and pages CRUD
    chat.ts         # AI chat SSE endpoint (spawns Claude Code)
    build.ts        # Build plan/execute SSE endpoints
    history.ts      # Canvas history
    screenshot.ts   # Playwright screenshot capture
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/pages` | List pages |
| POST | `/api/projects/:id/pages` | Create page |
| PATCH | `/api/pages/:pageId` | Update page |
| DELETE | `/api/pages/:pageId` | Delete page |
| POST | `/api/chat` | Chat (SSE stream) |
| GET | `/api/chat/threads?pageId=` | Load chat thread |
| POST | `/api/build/plan` | Generate build plan (SSE) |
| POST | `/api/build/execute` | Execute build (SSE) |
| GET | `/api/screenshots/:filename` | Serve screenshot files |

## Custom Shape Types (via customData)

Kodejam shapes are standard Excalidraw elements tagged with `customData.kodejam`:

- `wireframe-box`: Dashed rectangle with label, description, build status
- `sticky-note`: Yellow-filled rectangle with text
- `screenshot`: Image element with description, build ID, timestamp, and imageUrl

## Screenshot Workflow

1. User sets `dev_url` in project settings (e.g., `http://localhost:3000`)
2. In chat, asks "show me the dashboard"
3. Claude reads codebase, outputs `[SCREENSHOT:{"urls":[...],"descriptions":[...]}]`
4. Backend captures screenshots via Playwright, saves to `.kodejam/screenshots/`
5. Screenshots served via `/api/screenshots/:filename?repo=...`
6. Screenshot shapes placed on canvas in a flow layout with arrows and labels
