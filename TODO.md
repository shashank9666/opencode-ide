# TODO

> Goal: Push the project past **9.5/10** and make it competitive with Cursor, Windsurf, Claude Code, and GitHub Copilot Workspace.

## High Priority — Core UX & Reliability

- [x] VS Code-level UI/UX polish
  - Improve editor chrome, tabs, sidebar, and panels
  - Smooth animations, consistent spacing, refined color tokens
  - Better loading states and error boundaries
- [x] Better onboarding for first-time users
  - Guided setup walkthrough (provider selection, project open, first prompt)
  - In-app tips and tooltips for key features
- [ ] Reliability improvements around permissions and providers
  - Graceful provider fallback on failure
  - Clear permission-request dialogs with explainers
  - Timeout and retry handling for LLM requests

## High Priority — Developer Experience

- [x] One-click provider setup
  - Detect available providers (Ollama, OpenAI-compatible, etc.)
  - Auto-configure from environment variables
  - UI-based API key entry without manual config edits
- [ ] Better Git integration
  - Inline blame annotations
  - AI-assisted commit message generation
  - Git conflict resolution with AI
  - Visual diff view for staged/unstaged changes
- [ ] Stronger debugging tools
  - Integrated breakpoint debugging support
  - Variable inspection and call stack
  - AI-suggested fix for runtime errors

## Medium Priority — Intelligence & Context

- [ ] More intelligent context management for very large repositories
  - Smart file relevance scoring
  - Automatic retrieval-augmented generation (RAG) of project context
  - Token-aware context window packing
- [ ] Persistent AI memory
  - Per-project memory across sessions
  - Remember user preferences and past decisions
  - Ability to forget/reset memory
- [ ] Better file indexing
  - Background indexing on project open
  - Symbol search and go-to-definition
  - Fast fuzzy file finder

## Medium Priority — Agent & Workflow

- [ ] Multi-agent orchestration
  - Delegate subtasks to specialized subagents in parallel
  - Agent coordination and result merging
  - Configurable agent roles (planner, coder, reviewer, tester)
- [ ] Better agent planning/execution visualization
  - Step-by-step plan preview before execution
  - Real-time progress indicator for multi-step tasks
  - Ability to approve/deny individual steps
- [ ] Background autonomous tasks
  - Run tasks without blocking the UI
  - Notifications when background tasks complete
  - Schedule recurring tasks

## Medium Priority — Editor & Extensions

- [ ] Extension ecosystem
  - Plugin API documentation and examples
  - Extension marketplace (browse, install, update)
  - Sandboxed plugin execution
- [ ] Integrated terminal AI
  - AI suggestions in the terminal
  - Natural-language-to-shell translation
  - Error explanation and fix suggestions for command output

## Lower Priority — Advanced Features

- [ ] Voice coding
  - Speech-to-text input for prompts and code
  - Voice commands for common actions
  - Offline-capable transcription
- [ ] Built-in browser automation
  - Preview and test web apps inside the IDE
  - AI-driven E2E test generation
  - Screenshot-based debugging
- [ ] MCP server management UI
  - Visual list of connected MCP servers
  - One-click add/remove/reconnect
  - Health monitoring and logs
- [ ] Visual workflow builder
  - Drag-and-drop pipeline construction
  - Visual representation of agent steps
  - Export/import workflow definitions
- [ ] Git conflict resolution with AI
  - AI suggests merged result for each conflict
  - Side-by-side conflict viewer
  - Accept/reject individual hunks

## Infrastructure & Quality

- [ ] Better testing infrastructure
  - Increase test coverage across packages
  - Integration tests for multi-package workflows
  - E2E tests for critical user journeys
- [ ] Performance optimization
  - Lazy loading for large workspaces
  - Virtualized file tree for monorepos
  - Optimized bundle size for web target
- [ ] Documentation improvements
  - API reference for core packages
  - Migration guides for breaking changes
  - Video tutorials for common workflows

---

## Progress Legend

- `[ ]` Not started
- `[/]` In progress
- `[x]` Completed

_Last updated: 2026-06-30_