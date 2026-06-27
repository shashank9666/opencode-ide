## Debugging

- NEVER try to restart the app, or the server process, EVER. 

## Local Dev

- `opencode dev web` proxies `https://app.opencode.ai`, so local UI/CSS changes will not show there.
- For local UI changes, run the backend and app dev servers separately.
- Backend (from `packages/opencode`): `bun run --conditions=browser ./src/index.ts serve --port 4098`
- App (from `packages/app`): `bun dev -- --port 4444`
- Open `http://localhost:4444` to verify UI changes (it targets the backend at `http://localhost:4098`).

## SolidJS

- Always prefer `createStore` over multiple `createSignal` calls

## Tool Calling

- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE.

## Browser Automation

Use the Playwright MCP tools for web automation (NOT `agent-browser` CLI which opens new OS windows).

Core workflow:

1. `playwright_browser_navigate` with `url: "<url>"` - Navigate to page
2. `playwright_browser_snapshot` - Get interactive elements
3. `playwright_browser_click` / `playwright_browser_fill_form` / `playwright_browser_type` - Interact using element refs
4. Re-snapshot after page changes

Always open new pages via `playwright_browser_tabs` with `action: "new"` rather than launching a new browser. This keeps all browsing in one place.
