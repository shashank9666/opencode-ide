# OpenCode Web IDE - Walkthrough

## Project Overview

OpenCode Web is a full-featured web IDE with AI integration. It consists of multiple packages in a monorepo:

- `packages/app/` - Web IDE frontend (SolidJS + Monaco Editor)
- `packages/opencode/` - Core backend (Effect-TS, session runtime, tool system)
- `packages/core/` - Shared core library (types, schemas, utilities)
- `packages/tui/` - Terminal UI (alternative frontend)
- `packages/sdk/` - Client SDK
- `packages/ui/` - UI component library
- `packages/desktop/` - Desktop application

## Architecture

### Frontend (packages/app)

The IDE frontend is built with SolidJS and features:

- **EditorArea** - Monaco-based code editor with split panes, tab management, diff preview
- **FullIde** - Main IDE page orchestrating panels, permissions, file focus
- **ReviewChangesPanel** - Panel for reviewing AI file changes with side-by-side diff
- **BrowserPreviewPanel** - In-IDE browser preview with tab management
- **Permission System** - Ask/allow/deny UI for AI tool permissions
- **Workspace** - Editor workspace tree managing groups, tabs, file states

### Backend (packages/opencode)

The backend uses Effect-TS and features:

- **Session Runtime** - Process-local session coordinator
- **Tool System** - Plugin-based tool execution with permission enforcement
- **Permission Service** - Rule-based permission evaluation (allow/deny/ask)
- **Agent System** - Configurable AI agents with custom system prompts
- **Event System** - EventV2 bridge for real-time frontend sync
- **Snapshot** - Git-based snapshot diff computation

## Key Flows

### AI Tool Execution
1. AI calls a tool (edit, write, read, etc.)
2. Tool framework validates parameters
3. Permission service evaluates rules (allow/deny/ask)
4. If "ask": frontend shows permission dialog + diff preview
5. User approves/rejects → tool continues or is blocked
6. On approval: tool executes, file is written, events are published
7. Frontend reloads file content from disk

### Session Diff Flow
1. AI completes a message step
2. Backend computes git snapshot diff (between step-start and step-finish)
3. `session.diff` event is published to frontend
4. Frontend sync stores diff in `session_diff` data
5. ReviewChangesPanel displays the diff

## Common Development Tasks

### Adding a new tool
1. Define parameters schema in a new file under `packages/opencode/src/tool/`
2. Use `Tool.define()` with description, parameters, and execute function
3. Add `ctx.ask()` with appropriate permission type inside execute
4. Register the tool in `packages/opencode/src/tool/registry.ts`
5. Add a TXT description file

### Adding a UI panel
1. Create component under `packages/app/src/components/`
2. Register as a virtual file in FullIde.tsx (e.g., `review://changes`)
3. Add handler in EditorArea.tsx to render panel when virtual file is active

## Permission Types

| Permission | Used By | Description |
|---|---|---|
| `edit` | Edit tool, ApplyPatch tool | File content edits |
| `filesystem.write.project` | Write tool | Full file writes |
| `filesystem.read.project` | Read tool | File reads |
| `terminal.all` | Shell tool | Terminal commands |
| `websearch` | WebSearch tool | Web searches |
| `grep` | Grep tool | Code searches |
| `glob` | Glob tool | File pattern searches |

## Debugging

- Frontend dev: `bun dev -- --port 4444` from `packages/app/`
- Backend dev: `bun run --conditions=browser ./src/index.ts serve --port 4098` from `packages/opencode/`
- Tests: `bun test` from individual package directories
- Type checking: `bun typecheck` from package directories
