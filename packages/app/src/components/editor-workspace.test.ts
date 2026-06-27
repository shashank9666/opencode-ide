import { createRoot } from "solid-js"
import { expect, test } from "bun:test"
import { createEditorWorkspace } from "./editor-workspace"

test("openFile uses the resolved active group when the stored id is stale", () => {
  createRoot((dispose) => {
    const workspace = createEditorWorkspace()

    workspace.loadSnapshot({
      type: "group",
      id: "group-2",
      files: [],
      activeFile: null,
    })

    workspace.openFile("src/index.ts", "console.log('hello')")

    expect(workspace.getActiveGroup()?.id).toBe("group-2")
    expect(workspace.getFileState("src/index.ts", "group-2")?.path).toBe("src/index.ts")
    dispose()
  })
})
