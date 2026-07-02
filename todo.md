# OpenCode Web IDE - Task Tracking

## High Priority

### [x] Fix split window close bug
- **Root cause**: Close pane buttons used `props.activeGroupId` (shared across all panes) instead of the pane's own group ID
- **Fix**: Use `group().id` directly in the close handler (`EditorArea.tsx:492,506`)
- **Status**: Completed

### [x] Fix review changes panel diff stats (+921 -0)
- **Root causes**:
  - `setOriginalContent` had a lock condition preventing updates on subsequent edits
  - `loadFileDiff` fell back to empty string when git HEAD lookup failed for new files
- **Fixes**:
  - Removed lock condition in `setOriginalContent` (editor-workspace.tsx:155)
  - Improved `loadFileDiff` fallback chain: git HEAD → workspace originalContent → workspace savedContent → empty string (ReviewChangesPanel.tsx:117-137)
- **Status**: Completed

### [x] Fix permission/focus flow
- **Root causes**:
  - `pendingEditPermission` filter included `read_file` (wrong - reading doesn't modify files)
  - Missing `filesystem.write.project` permission for the write tool
  - `ai-file-created` handler re-opened files already opened by the permission effect
  - No debounce for rapid multi-edit focus changes
- **Fixes**:
  - Updated filter: removed `read_file`, added `filesystem.write.project` (FullIde.tsx:498-506)
  - Added 50ms debounce to the file focus effect (FullIde.tsx:548-570)
  - Made `ai-file-created` handler skip files already open as active (FullIde.tsx:171-180)
- **Status**: Completed

### [x] Fix split pane close button using wrong group ID
- **Root cause**: Close buttons used `props.activeGroupId` prop which is shared across ALL groups
- **Fix**: Each group now closes using its own `group().id` from the memoized group data
- **Status**: Completed

### [ ] Fix AI rules/settings enforcement
- **Status**: Investigation complete - need to verify instructions loading
- **Next**: Check if configured rules in `.opencode/rules/` are properly loaded and injected into system prompt

## Medium Priority

### [ ] Playwright browser enhancements
- **Done**: Added page transition animation (fade effect), action indicator overlay (click ping, typing dots, navigate spinner)
- **Needed**: Mouse click coordinate overlay, typing character-by-character animation, workflow step indicator panel

### [ ] Add review button to toolbar
- **Status**: Completed - added `git-pull-request` icon button in the tab bar toolbar area (EditorArea.tsx:447)

## Low Priority

### [x] Create walkthrough.md
- **Status**: Completed - comprehensive project overview at `walkthrough.md`

### [x] Create todo.md
- **Status**: Completed - this file

## Known Issues

| Issue | Severity | Notes |
|---|---|---|
| `originalContent` lock removed - potential regression | Low | Previously prevented overwrite of original content mid-edit. Now always allows updates |
| Playwright action events not yet dispatched | Medium | Added listener for `playwright-action` custom events, but no code dispatches them yet |
| Review panel shows empty sidebar for new files | Low | New files naturally have no "before" state, showing +N -0 is correct behavior |
