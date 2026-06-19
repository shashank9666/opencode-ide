import { createSignal, For, Show, type JSX } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { DockablePanelHeader } from "./DockablePanel"
import Session from "@/pages/session"

export default function AIWorkspacePanel(props: {
  onFloat?: () => void
  onClose?: () => void
  onDragStart?: (e: MouseEvent) => void
  activeSessionId: string | null
  recentSessions: any[]
  handleNewSession: () => void
  confirmDeleteSession: (id: string, title: string) => void
  setActiveSessionId: (id: string | null) => void
  dir: string
}) {
  return (
    <div class="size-full flex flex-col bg-surface-base">
      <DockablePanelHeader
        label="AI Workspace"
        icon="brain"
        onFloat={props.onFloat}
        onClose={props.onClose}
        onDragStart={props.onDragStart}
      />
      <div class="flex-1 min-h-0 overflow-y-auto">
        <Show when={props.activeSessionId} fallback={
          <div class="p-3 flex flex-col gap-2">
            <button type="button" class="w-full py-1.5 px-3 text-13-medium bg-accent-base text-white hover:bg-accent-base-hover rounded-md transition-colors flex items-center justify-center gap-1.5" onClick={props.handleNewSession}>
              <Icon name="plus" size="small" /> New Chat Session
            </button>
            <div class="text-11-medium text-text-weaker uppercase tracking-wider mt-4 px-1">RECENT</div>
            <For each={props.recentSessions}>
              {(session) => (
                <div class="group flex items-center justify-between px-2 py-1 rounded-md hover:bg-surface-raised-base-hover transition-colors cursor-pointer" onClick={() => props.setActiveSessionId(session.id)}>
                  <span class="flex-1 text-13-regular truncate text-text-strong">{session.title || "Untitled"}</span>
                  <IconButton icon="trash" variant="ghost" size="small" class="size-5 rounded opacity-0 group-hover:opacity-100" onClick={(e: MouseEvent) => { e.stopPropagation(); props.confirmDeleteSession(session.id, session.title || "Untitled") }} />
                </div>
              )}
            </For>
          </div>
        }>
          {(sid) => (
            <div class="size-full flex flex-col">
              <div class="flex items-center px-2 py-1 border-b border-border-base bg-surface-base shrink-0">
                <button type="button" class="text-12-regular text-text-weak hover:text-text-strong flex items-center gap-1 transition-colors" onClick={() => props.setActiveSessionId(null)}>
                  <Icon name="chevron-left" size="small" /> Back
                </button>
              </div>
              <div class="flex-1 min-h-0"><Session sessionId={sid()} dir={props.dir} embedded={true} /></div>
            </div>
          )}
        </Show>
      </div>
    </div>
  )
}
