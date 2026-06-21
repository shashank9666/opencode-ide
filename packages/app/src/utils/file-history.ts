import { createStore } from "solid-js/store"
import { showToast } from "@/utils/toast"

export const MAX_UNDO_STACK_SIZE = 50
export const MAX_REDO_STACK_SIZE = 50

export type FileAction =
  | { type: "create"; path: string; isDir: boolean }
  | { type: "delete"; path: string; isDir: boolean; content?: string }
  | { type: "rename"; oldPath: string; newPath: string }

const [state, setState] = createStore({
  undoStack: [] as FileAction[],
  redoStack: [] as FileAction[],
})

export function pushFileAction(action: FileAction) {
  setState("undoStack", (prev) => {
    const next = [...prev, action]
    if (next.length > MAX_UNDO_STACK_SIZE) {
      return next.slice(next.length - MAX_UNDO_STACK_SIZE)
    }
    return next
  })
  // Clear redo stack on new action
  setState("redoStack", [])
}

export function canUndoFileAction() {
  return state.undoStack.length > 0
}

export function canRedoFileAction() {
  return state.redoStack.length > 0
}

// Pass the sdk instance so this utility doesn't need to use a hook
export async function undoFileAction(sdk: any) {
  if (state.undoStack.length === 0) {
    showToast({ title: "Undo", description: "Nothing to undo." })
    return
  }

  const action = state.undoStack[state.undoStack.length - 1]
  
  try {
    if (action.type === "create") {
      // Undo create: Delete it
      await sdk.client.v2.fs.delete({ path: action.path })
    } else if (action.type === "delete") {
      // Undo delete: Restore it
      if (action.isDir) {
        await sdk.client.v2.fs.mkdir({ path: action.path })
      } else {
        await sdk.client.v2.fs.writeFile({ path: action.path, content: action.content || "" })
      }
    } else if (action.type === "rename") {
      // Undo rename: Rename back
      await sdk.client.v2.fs.rename({ oldPath: action.newPath, newPath: action.oldPath })
    }

    // Move from undo to redo
    setState("undoStack", (prev) => prev.slice(0, prev.length - 1))
    setState("redoStack", (prev) => {
      const next = [...prev, action]
      if (next.length > MAX_REDO_STACK_SIZE) {
        return next.slice(next.length - MAX_REDO_STACK_SIZE)
      }
      return next
    })
    showToast({ title: "Undo successful", description: `Undid ${action.type}` })
  } catch (error) {
    showToast({ variant: "error", title: "Undo failed", description: String(error) })
  }
}

export async function redoFileAction(sdk: any) {
  if (state.redoStack.length === 0) {
    showToast({ title: "Redo", description: "Nothing to redo." })
    return
  }

  const action = state.redoStack[state.redoStack.length - 1]
  
  try {
    if (action.type === "create") {
      // Redo create: Create it again
      if (action.isDir) {
        await sdk.client.v2.fs.mkdir({ path: action.path })
      } else {
        await sdk.client.v2.fs.writeFile({ path: action.path, content: "" })
      }
    } else if (action.type === "delete") {
      // Redo delete: Delete it again
      await sdk.client.v2.fs.delete({ path: action.path })
    } else if (action.type === "rename") {
      // Redo rename: Rename it again
      await sdk.client.v2.fs.rename({ oldPath: action.oldPath, newPath: action.newPath })
    }

    // Move from redo to undo
    setState("redoStack", (prev) => prev.slice(0, prev.length - 1))
    setState("undoStack", (prev) => {
      const next = [...prev, action]
      if (next.length > MAX_UNDO_STACK_SIZE) {
        return next.slice(next.length - MAX_UNDO_STACK_SIZE)
      }
      return next
    })
    showToast({ title: "Redo successful", description: `Redid ${action.type}` })
  } catch (error) {
    showToast({ variant: "error", title: "Redo failed", description: String(error) })
  }
}
