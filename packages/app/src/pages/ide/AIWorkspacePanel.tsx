import { createSignal, For, Show } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { InlineInput } from "@opencode-ai/ui/inline-input"
import Session from "@/pages/session"
import { useSDK } from "@/context/sdk"
import { showToast } from "@/utils/toast"

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
  onCompact?: () => void
  canCompact?: boolean
}) {
  const [hoveredSession, setHoveredSession] = createSignal<string | null>(null)
  const [renamingSessionId, setRenamingSessionId] = createSignal<string | null>(null)
  const [renameDraft, setRenameDraft] = createSignal("")
  const sdk = useSDK()

  const getSessionIndex = (id: string) => {
    const idx = props.recentSessions.findIndex((s) => s.id === id)
    return idx >= 0 ? idx : 0
  }

  const startRename = (session: { id: string; title?: string }) => {
    setRenamingSessionId(session.id)
    setRenameDraft(session.title || "New session")
  }

  const saveRename = async () => {
    const id = renamingSessionId()
    if (!id) return
    const next = renameDraft().trim()
    if (!next) { setRenamingSessionId(null); return }
    try {
      await sdk().client.session.update({ sessionID: id, title: next })
    } catch (e) { showToast({ variant: "error", title: "Rename failed", description: String(e) }) }
    setRenamingSessionId(null)
  }

  const cancelRename = () => {
    setRenamingSessionId(null)
  }

  return (
    <div class="size-full flex flex-col overflow-hidden" style={{ background: "var(--background-bg-base)" }}>
      <Show
        when={props.activeSessionId}
        fallback={
          /* ── Session list view ── */
          <div class="size-full flex flex-col min-h-0">
            {/* Header */}
            <div class="flex items-center justify-between px-3 py-[7px] shrink-0" style={{ "border-bottom": "1px solid var(--border-muted)" }}>
              <div class="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="color: var(--icon-weaker);">
                  <path d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  <path d="M8 6L10 8L8 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="text-11-medium uppercase tracking-wider" style="color: var(--text-weaker);">Sessions</span>
              </div>
              <div class="flex items-center gap-1">
                <IconButton
                  icon="plus"
                  variant="ghost"
                  size="small"
                  class="size-5 rounded"
                  onClick={props.handleNewSession}
                  aria-label="New session"
                />
                <Show when={props.onClose}>
                  <IconButton
                    icon="close"
                    variant="ghost"
                    size="small"
                    class="size-5 rounded"
                    onClick={props.onClose}
                    aria-label="Close panel"
                  />
                </Show>
              </div>
            </div>

            {/* New session button */}
            <div class="px-2 pt-2 shrink-0">
              <button
                type="button"
                class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-13-regular transition-all duration-75"
                style={{
                  background: "var(--surface-base)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-muted)",
                }}
                classList={{ "hover:bg-overlay-hover hover:text-text-base": true }}
                onClick={props.handleNewSession}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="color: var(--icon-weaker);">
                  <path d="M7 1.5V12.5M1.5 7H12.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
                <span>New session</span>
              </button>
            </div>

            {/* Session list */}
            <div class="flex-1 overflow-y-auto min-h-0 px-2 py-2 flex flex-col gap-0.5">
              <Show
                when={props.recentSessions.length > 0}
                fallback={
                  <div class="flex-1 flex flex-col items-center justify-center text-center gap-4 py-10">
                    <div class="size-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--overlay-hover)" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--icon-weaker); opacity: 0.5;">
                        <path d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M12 9L14.5 11.5L12 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <p class="text-12-regular max-w-[180px]" style="color: var(--text-weaker);">
                      No sessions yet. Start a new session to begin.
                    </p>
                  </div>
                }
              >
                <For each={props.recentSessions}>
                  {(session, index) => {
                    const isHovered = () => hoveredSession() === session.id
                    return (
                      <div
                        class="group relative flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-all duration-75"
                        classList={{
                          "bg-overlay-hover": isHovered(),
                        }}
                        onMouseEnter={() => setHoveredSession(session.id)}
                        onMouseLeave={() => setHoveredSession(null)}
                        onClick={() => props.setActiveSessionId(session.id)}
                      >
                        {/* Session number avatar */}
                        <div
                          class="shrink-0 size-7 rounded-lg flex items-center justify-center text-12-medium font-semibold"
                          style={{
                            background: `hsl(${(index() * 47 + 140) % 360}, 55%, 50%)`,
                            color: "white",
                            "font-size": "11px",
                          }}
                        >
                          {session.title ? session.title.charAt(0).toUpperCase() : "N"}
                        </div>

                        {/* Session title */}
                        <div class="flex-1 min-w-0">
                          <Show
                            when={renamingSessionId() === session.id}
                            fallback={
                              <p class="text-12-regular truncate" style={{ color: isHovered() ? "var(--text-base)" : "var(--text-muted)" }}>
                                {session.title || "New session"}
                              </p>
                            }
                          >
                            <InlineInput
                              value={renameDraft()}
                              class="text-12-regular w-full rounded-[4px] px-1 -ml-1"
                              style="--inline-input-shadow: var(--shadow-xs-border-select)"
                              style={{ color: "var(--text-base)" }}
                              onInput={(e) => setRenameDraft(e.currentTarget.value)}
                              onKeyDown={(e) => {
                                e.stopPropagation()
                                if (e.key === "Enter") { e.preventDefault(); void saveRename() }
                                if (e.key === "Escape") { e.preventDefault(); cancelRename() }
                              }}
                              onBlur={saveRename}
                            />
                          </Show>
                        </div>

                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity duration-75">
                          <Show when={renamingSessionId() !== session.id}>
                            <IconButton
                              icon="edit"
                              variant="ghost"
                              size="small"
                              class="size-5 rounded"
                              onClick={(e: MouseEvent) => {
                                e.stopPropagation()
                                startRename(session)
                              }}
                              aria-label="Rename session"
                            />
                            <IconButton
                              icon="trash"
                              variant="ghost"
                              size="small"
                              class="size-5 rounded"
                              style={{ color: "var(--state-danger)" }}
                              onClick={(e: MouseEvent) => {
                                e.stopPropagation()
                                props.confirmDeleteSession(session.id, session.title || "Untitled")
                              }}
                              aria-label="Delete session"
                            />
                          </Show>
                        </div>
                      </div>
                    )
                  }}
                </For>
              </Show>
            </div>
          </div>
        }
      >
        {(sid) => (
          /* ── Active session view ── */
          <div class="size-full flex flex-col min-h-0">
            {/* Back bar - more premium */}
            <div class="flex items-center gap-1 px-2 py-[5px] shrink-0" style={{ background: "var(--background-bg-deep)", "border-bottom": "1px solid var(--border-muted)" }}>
              <button
                type="button"
                class="flex items-center gap-1 text-12-regular rounded-md px-1.5 py-1 transition-colors duration-75"
                style={{ color: "var(--text-muted)" }}
                classList={{ "hover:bg-overlay-hover hover:text-text-base": true }}
                onClick={() => props.setActiveSessionId(null)}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M7.5 2.5L4 6L7.5 9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              {/* Session title in center */}
              <div class="flex-1 min-w-0 flex items-center justify-center">
                <span class="text-12-medium truncate px-2" style={{ color: "var(--text-base)" }}>
                  {props.recentSessions.find((s) => s.id === sid())?.title || "New session"}
                </span>
              </div>

              <div class="flex items-center gap-1">
                <IconButton
                  icon="plus"
                  variant="ghost"
                  size="small"
                  class="size-5 rounded shrink-0"
                  onClick={props.handleNewSession}
                  title="New session"
                  aria-label="New session"
                />

                <Show when={props.onCompact}>
                  <IconButton icon="collapse" variant="ghost" size="small" class="size-5 rounded shrink-0" onClick={props.onCompact} disabled={!props.canCompact} title="Compact Session" aria-label="Compact Session" />
                </Show>

                <Show when={props.onClose}>
                  <IconButton
                    icon="close"
                    variant="ghost"
                    size="small"
                    class="size-5 rounded shrink-0"
                    onClick={props.onClose}
                    aria-label="Close"
                  />
                </Show>
              </div>
            </div>

            {/* Embedded session */}
            <div class="flex-1 min-h-0 overflow-hidden">
              <Session sessionId={sid()} dir={props.dir} embedded={true} />
            </div>
          </div>
        )}
      </Show>
    </div>
  )
}
