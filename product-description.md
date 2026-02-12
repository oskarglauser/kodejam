# Kodejam

## What is it

Kodejam is a visual, collaborative interface that replaces the terminal as the primary way to work with AI coding agents like Claude Code. Instead of typing text prompts, you sketch, arrange, and describe what you want on a spatial canvas. The AI interprets your visual intent and writes code directly to your codebase.

Think Figjam meets Claude Code. You're not designing pixels. You're thinking out loud, visually, and the AI turns that into working software.

## The problem

Most product work happens visually. You sketch on whiteboards, draw flows in Figjam, annotate screenshots, rearrange sticky notes. But when it's time to build, all of that gets translated into text prompts typed into a terminal or chat window. That translation step is slow, lossy, and unnatural.

At the same time, AI coding tools are powerful but blind. They don't see what you see. You end up describing layouts, flows, and spatial relationships in words when a quick sketch would say it better.

## How it works

### Projects

Each project connects to a git repo. When you set up a project, the AI reads through your codebase and builds an understanding of your stack, design system, component library, database schema, API routes, and existing patterns. This becomes the persistent project context.

### Pages

Within a project you create pages. Each page is a canvas for a specific feature, screen, or flow. "Onboarding flow," "Settings redesign," "Payment integration." Each page has its own canvas and conversation history with the AI.

### The canvas

The canvas is intentionally low-fidelity. You're communicating intent, not crafting final designs.

You can draw rough boxes and label them. Paste screenshots of existing UI or references. Draw arrows to show flow and navigation. Add sticky notes with logic descriptions like "if user has solar panels, show this section." Group elements together and name the groups. Create simple wireframe-like layouts by arranging shapes.

The visual language is closer to whiteboarding than design tools. Rough, fast, messy is fine.

### AI as a canvas participant

The AI doesn't just receive instructions. It's an active participant on the canvas.

Select a box you drew and ask "what component do we already have for this?" and the AI responds, maybe dropping a reference onto the canvas showing the existing component from your design system.

Draw a rough flow and say "build this." The AI breaks it down into tasks, shows what files it would create or modify, and asks clarifying questions right there on the canvas.

Paste a screenshot of a competitor feature and say "we need something like this but using our design system." The AI maps it to your existing components and patterns.

Ask open questions like "what's the best way to handle state here?" and the AI responds with suggestions grounded in your actual codebase.

### Building

When you're ready to execute, you don't switch to a terminal. You select elements or an entire page and hit Build. The AI shows you a plan: files to create, files to modify, dependencies to add. You can adjust the plan right on the canvas. Then it executes, writing real code to your repo. Results, errors, and follow-up questions appear back on the canvas.

You can also build incrementally. Draw one piece, build it, see the result, draw the next piece. The canvas becomes a living document that tracks what's been sketched, what's been built, and what's still in progress.

### Beyond UI: data and logic

For backend work like database schemas, API endpoints, or business rules, there are structured canvas elements. A card where you describe a data model in plain language. The AI can also infer these from your drawings. If you sketch a user profile card with specific fields, it suggests the database schema and API structure to support it.

A "data view" on any page shows the relevant tables, relationships, and endpoints that support the UI you've drawn.

## When the AI interacts

The canvas should feel like a quiet workspace. The AI waits until you pull it in.

### When you ask it directly

Select an element or group of elements and type a question or instruction. "What component do we have for this?" or "Rewrite this logic." The AI responds on the canvas, in a thread, or both depending on what makes sense.

### When you hit Build

Select elements and trigger a build. The AI generates a plan shown as a checklist or overlay on the canvas, then executes after you approve. Results come back onto the canvas: green checkmarks, errors, or follow-up questions attached to the relevant elements.

### When it spots issues

As you draw and connect things, the AI flags problems passively. A subtle indicator on a box saying "this references a database table that doesn't exist yet" or "this flow has no error state." Not intrusive. More like linting for your canvas. You choose whether to engage with it.

### When a teammate tags it

In comments or threads, someone tags the AI with a question. It responds in that thread with full context of the canvas and codebase.

### When you ask it to generate

"Map out the user flow for password reset based on our current auth setup." The AI draws boxes and arrows on the canvas based on your actual code. You then move things around, adjust, and refine.

### When it stays quiet

While you're just sketching and thinking. No auto-suggestions popping up while you draw. No unsolicited opinions. The default is silence, not noise. You want to think freely and bring the AI in when you're ready. This is maybe the most important design decision in the whole product.

### Screenshots as build responses

When the AI finishes building, it captures a screenshot of the rendered output and places it directly on the canvas where your original sketch was. Your rough box labeled "pricing card" gets replaced or overlaid with an actual image of the real component.

Screenshots work better than live preview embeds in this context. They're lightweight and don't slow down the canvas. They work at any zoom level. And they feel natural in a whiteboard-like tool where you're used to pasting images.

The screenshot sits as a visual checkpoint. You can draw annotations on top of it ("this spacing feels off", "move this button to the right") and ask the AI to adjust. It rebuilds and drops a new screenshot.

For flows, the AI screenshots each view and lays them out connected by the same arrows you originally drew. Your sketched flow becomes a flow of real screenshots. You instantly see how the whole thing hangs together.

Each screenshot has a subtle "built" badge and timestamp. Click it and you get options: view live preview, view diff, rebuild, or revert to sketch. The screenshot is both a visual result and an entry point to go deeper.

You can also ask for screenshots outside of building. "Show me what the current settings page looks like" and the AI captures it and drops it on the canvas. Useful for referencing existing UI while sketching something new.

The AI should never flood the canvas with screenshots unprompted. Same principle as everything else: screenshots appear as part of a build response or when you ask for them. Not because the AI wants to show off.

## Where the code lives

There are three scenarios that affect how collaboration works.

### Local codebase, solo

The simplest case. Kodejam runs as a desktop app or local server connected to your repo on your machine. Similar to how Cursor or Claude Code works today. The canvas is your interface, the code is on your disk. This is probably the MVP.

### Local codebase, collaborating on the canvas

The canvas lives in the cloud so multiple people can work on it together. But the codebase is still local to whoever runs the builds. A product person and a developer are both on the canvas, but only the developer has the repo and triggers builds from their machine. Screenshots and build results sync back to the shared canvas.

This is fine for most small teams. The product person doesn't need the code. They just need to see what got built and be able to comment and sketch. A designer/founder + developer team works naturally this way. One person thinks visually, the other approves and executes.

### Cloud-hosted codebase

The repo lives in the cloud through a dev container, Codespaces-style environment, or connected GitHub repo. Anyone on the team can trigger builds and the AI executes in the cloud. This is the most powerful version but also the most complex to build.

The path is probably: start with local solo, make canvas collaboration work soon after, and treat the cloud-hosted codebase as the longer-term play.

### Branching and environments

For collaboration, each canvas page or build session could map to a git branch. When someone starts building a feature, Kodejam creates a branch automatically. Multiple people work on different features without stepping on each other. When a feature is done, you merge, and that could even happen from the canvas: "This feature is ready, create a PR."

Preview environments would be powerful too. Each built feature gets a preview URL so anyone on the team can test the real thing, not just look at screenshots.

## From wireframes to real screens

This is a core interaction, not a nice-to-have.

You sketch rough wireframes on the canvas. Boxes, labels, arrows, sticky notes with logic. You select the whole flow and hit Build. The AI builds each screen and captures screenshots. Each screenshot slides into place where your wireframe was, keeping the same position and connections on the canvas. Your hand-drawn flow is now a flow of real screenshots, still connected by the same arrows.

The wireframes don't have to disappear. You can toggle between "sketch view" and "built view." Sometimes you want to go back to the rough version to rethink something, then rebuild.

If only some screens have been built, you have a mix on the canvas. Some boxes are still sketches, some are screenshots. That's fine and actually useful. You can see at a glance what's real and what's still an idea.

From there you iterate. Annotate a screenshot with notes, ask the AI to adjust, it rebuilds and drops a new screenshot in place. The cycle is: sketch, build, see, annotate, rebuild. It never leaves the canvas.

## Collaboration

### Real-time multiplayer

Like Figma, multiple people work on the same canvas simultaneously. A product person sketches a flow, a developer adds technical constraints ("this API is rate limited, we need caching"), and the AI sees all of it as context. The conversation with the AI is shared, so everyone sees the questions and decisions.

### Developer handoff (without the handoff)

When a product person has built out a flow with rough wireframes, logic descriptions, and data requirements, a developer opens that same page. They can click any element to see what code the AI would generate. Review the suggested file structure and architecture. Override or refine the technical approach before anything gets written. Run the build with their own judgment on implementation.

The canvas is the spec, the handoff document, and the build tool in one. No more "here's a Figma link and a Notion doc, good luck."

### Roles and guardrails

Lightweight roles keep things safe. A product person draws and describes. A developer reviews the AI's technical plan and approves before code gets written. A founder can view and comment but builds require developer approval. This prevents non-technical users from accepting code they don't understand.

### Comments and threads

Comment on any canvas element. The AI is a participant in threads too. Tag it in a comment: "is this the right approach for caching here?" and it responds in context, with full knowledge of the codebase.

### Async workflows

Not everyone needs to be online at the same time. Someone sketches a feature in the morning, leaves notes and questions. A developer picks it up later. The AI can prep things in between: "I've analyzed this flow and here are three decisions we need to make before building."

### Version history

Every canvas change and every build is tracked. You can see the evolution of a feature from initial sketch to implementation. This creates documentation that normally never gets written. The "why" behind decisions lives right there on the canvas alongside the "what."

## What makes this different

**vs Figma/Figjam:** Great for visual thinking but zero connection to code. Your designs and your implementation live in separate worlds.

**vs Claude Code / Cursor:** Powerful code generation but you're stuck describing visual and spatial things with words. The interface is a text box.

**vs V0 and similar generators:** Can generate UI from prompts but don't understand your existing codebase, design system, or architecture.

Kodejam sits in the gap. It's not a design tool (you're not refining pixels). It's not a code editor (you're not reading code). It's a thinking and directing tool where the canvas is your interface for shaping what gets built, fully connected to your real codebase.

## MVP

The first version is a local desktop app for a single user. You connect it to a repo on your machine, sketch on the canvas, and build through Claude Code.

### What's in

- Canvas with basic drawing tools: boxes, labels, arrows, sticky notes, image paste
- Project setup that connects to a local git repo and indexes the codebase
- Pages within a project for organizing features and flows
- Inline AI chat on canvas elements (select something, ask a question or give an instruction)
- Build flow: select elements, see the AI's plan, approve, execute
- Screenshot capture of built components placed back on the canvas
- Sketch view / built view toggle
- Build status indicators on canvas elements (sketch, building, built, error)
- Basic version history of canvas changes and builds

### What's not in (yet)

- Real-time multiplayer and collaboration
- Cloud-hosted codebases
- Roles and permissions
- Preview environments and deploy
- PR creation from canvas
- Live preview embeds (screenshots first, live later)

### Tech stack

**Canvas:** React with a spatial canvas library like tldraw (same engine behind Figjam-style interactions). Handles drawing, selecting, panning, zooming, and element connections out of the box.

**Desktop app:** Electron or Tauri for local file system access and repo connectivity. Tauri is lighter and feels more modern.

**AI integration:** Claude Code Agent SDK as the primary AI backend. This handles codebase indexing, code generation, file operations, and build execution. The canvas translates visual elements and user intent into agent tasks. The architecture should be agent-agnostic from the start, with a clean interface layer so other agents like Codex can be swapped in or run alongside Claude in the future.

**Screenshot capture:** Headless browser (Puppeteer or Playwright) to render built components and capture screenshots that get placed back on the canvas.

**State and storage:** Local SQLite database for project state, canvas data, and build history. Git integration through simple CLI commands or a library like isomorphic-git.

**Canvas data format:** JSON-based format that stores element positions, connections, labels, build states, and linked screenshots. Portable enough to sync to the cloud later when collaboration is added.

## Who it's for

Small product teams of 2 to 5 people where the distance between idea and implementation needs to be as short as possible. Founders who think visually but build with AI. Product designers who want their sketches to become real without a handoff process. Developers who want better context than a text prompt before the AI starts writing code.
