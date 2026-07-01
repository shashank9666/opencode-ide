# TODO

> Goal: Push the project past **9.5/10** and make it competitive with Cursor, Windsurf, Claude Code, and GitHub Copilot Workspace.

## High Priority — Core UX & Reliability

- [x] VS Code-level UI/UX polish
- [x] Better onboarding for first-time users
- [x] Reliability improvements around permissions and providers
- [x] Stronger debugging tools
  - Debug panel with breakpoints, variables, call stack, watch expressions exists (`DebugPanel.tsx`)
  - AI-suggested fix button added to error page
  - Real AI integration added via SDK in `packages/app/src/pages/error.tsx`

## High Priority — Developer Experience

- [x] One-click provider setup
  - Local provider detection (Ollama, LM Studio) added
- [x] Better Git integration
  - Source control panel with diff view, commit templates, push/pull/fetch
- [x] Inline blame annotations
  - Git blame gutter annotations implemented in `ide-editor.tsx` using `/api/git/blame`

## Medium Priority — Intelligence & Context

- [ ] More intelligent context management for very large repositories
- [ ] Persistent AI memory
- [ ] Better file indexing

## Medium Priority — Agent & Workflow

- [ ] Multi-agent orchestration
- [x] Better agent planning/execution visualization
  - Real-time Execution Flow panel added to session side panel (`execution-flow-panel.tsx`, `execution-flow.tsx`)
  - Shows full execution timeline: user messages, reasoning, tool calls, results, step metrics, agent switches, sub-agent spawns
  - Each node is expandable with full detail (thinking content, tool I/O, token/cost metrics)
  - Active nodes show spinner with pulsing border during execution
  - Aggregate metrics bar: total steps, tokens (in/out/thinking), cache hits, cost
  - Search filtering, agent indicator badge, empty state handling
  - Wired into session side panel as a new "Flow" tab
- [ ] Background autonomous tasks

## Medium Priority — Editor & Extensions

- [ ] Extension ecosystem
- [ ] Integrated terminal AI

## Lower Priority — Advanced Features

- [ ] Voice coding
- [ ] Built-in browser automation
- [ ] MCP server management UI
- [ ] Visual workflow builder
- [ ] Git conflict resolution with AI

## Infrastructure & Quality

- [ ] Better testing infrastructure
- [ ] Performance optimization
- [ ] Documentation improvements

---

## Progress Legend

- `[ ]` Not started
- `[/]` In progress
- `[x]` Completed