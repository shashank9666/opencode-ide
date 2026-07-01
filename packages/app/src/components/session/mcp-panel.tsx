import { createMemo, createSignal, For, Show } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { useSync } from "@/context/sync"
import { useSessionLayout } from "@/pages/session/session-layout"
import type { McpStatus } from "@opencode-ai/sdk/v2/client"

// ── Helpers ────────────────────────────────────────────────────────────────

function statusDot(status: McpStatus["status"]) {
  switch (status) {
    case "connected": return "bg-icon-success"
    case "disabled": return "bg-icon-weak"
    case "failed": return "bg-icon-danger"
    case "needs_auth": return "bg-icon-warning animate-pulse"
    case "needs_client_registration": return "bg-icon-warning animate-pulse"
    default: return "bg-icon-weak"
  }
}

function statusLabel(status: McpStatus["status"]) {
  switch (status) {
    case "connected": return "Connected"
    case "disabled": return "Disabled"
    case "failed": return "Failed"
    case "needs_auth": return "Needs Auth"
    case "needs_client_registration": return "Needs Registration"
    default: return "Unknown"
  }
}

function statusIcon(status: McpStatus["status"]) {
  switch (status) {
    case "connected": return { name: "check-small" as const, cls: "text-icon-success" }
    case "disabled": return { name: "dash" as const, cls: "text-icon-weak" }
    case "failed": return { name: "circle-ban-sign" as const, cls: "text-icon-danger" }
    case "needs_auth": return { name: "warning" as const, cls: "text-icon-warning" }
    case "needs_client_registration": return { name: "warning" as const, cls: "text-icon-warning" }
    default: return { name: "dash" as const, cls: "text-icon-weak" }
  }
}

// ── Server Row ─────────────────────────────────────────────────────────────

function ServerRow(props: { name: string; status: McpStatus; expanded: boolean; onToggle: () => void }) {
  const stat = () => statusIcon(props.status.status)
  const error = () => {
    if (props.status.status === "failed") return (props.status as { error: string }).error
    if (props.status.status === "needs_client_registration") return (props.status as { error: string }).error
    return undefined
  }

  return (
    <div class="rounded-lg border border-border-base bg-surface-base overflow-hidden">
      <div
        class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-raised-base transition-colors"
        onClick={props.onToggle}
      >
        <span class={`size-2 rounded-full shrink-0 ${statusDot(props.status.status)}`} />
        <Icon name="mcp" size="small" class="text-icon-weak shrink-0" />
        <div class="min-w-0 flex-1 flex flex-col gap-0.5">
          <span class="text-13-medium text-text-strong truncate">{props.name}</span>
          <span class="text-11-regular text-text-weak">{statusLabel(props.status.status)}</span>
        </div>
        <div class="shrink-0 flex items-center gap-2">
          <Icon name={stat().name} size="small" class={stat().cls} />
          <Icon name={props.expanded ? "chevron-down" : "chevron-right"} size="small" class="text-text-weak" />
        </div>
      </div>
      <Show when={props.expanded}>
        <div class="px-3 pb-3 pt-1 border-t border-border-weaker-base">
          <Show when={error()}>
            <div class="mt-2 p-2 rounded-md bg-critical-base/10 border border-critical-base/20">
              <div class="flex items-center gap-1.5 mb-1">
                <Icon name="warning" size="small" class="text-icon-danger" />
                <span class="text-11-medium text-icon-danger">Error</span>
              </div>
              <span class="text-11-regular text-text-base break-all">{error()}</span>
            </div>
          </Show>
          <div class="mt-2 text-11-regular text-text-weaker">
            Server: {props.name}
          </div>
        </div>
      </Show>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div class="h-full flex flex-col items-center justify-center text-center gap-3 px-6">
      <div class="size-12 rounded-xl bg-surface-raised-base flex items-center justify-center border border-border-weaker-base">
        <Icon name="mcp" size="normal" class="text-icon-weak" />
      </div>
      <div class="text-13-medium text-text-strong">No MCP servers</div>
      <div class="text-12-regular text-text-weak max-w-48">
        Configure MCP servers in Settings to extend the agent with external tools
      </div>
    </div>
  )
}

// ── Main Panel ─────────────────────────────────────────────────────────────

export function McpPanel() {
  const sync = useSync()
  const { params } = useSessionLayout()
  const [expanded, setExpanded] = createSignal<string | null>(null)
  const [search, setSearch] = createSignal("")

  const mcpStatus = createMemo(() => {
    const id = params.id
    if (!id) return {} as Record<string, McpStatus>
    return sync().data.mcp ?? {}
  })

  const serverNames = createMemo(() => {
    const q = search().toLowerCase().trim()
    const keys = Object.keys(mcpStatus())
    const filtered = q ? keys.filter((k) => k.toLowerCase().includes(q)) : keys
    return filtered.sort((a, b) => a.localeCompare(b))
  })

  const connectedCount = createMemo(() =>
    Object.values(mcpStatus()).filter((s) => s.status === "connected").length,
  )

  const totalCount = createMemo(() => Object.keys(mcpStatus()).length)

  const toggle = (name: string) => {
    setExpanded((prev) => (prev === name ? null : name))
  }

  return (
    <ScrollView class="h-full contain-strict">
      <div class="px-3 pt-3 pb-6 flex flex-col gap-1">
        {/* Header */}
        <div class="px-1 pb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Icon name="mcp" size="small" class="text-icon-interactive-base" />
            <span class="text-13-medium text-text-strong">MCP Servers</span>
          </div>
          <Show when={totalCount() > 0}>
            <div class="flex items-center gap-1.5 text-11-regular">
              <span class="size-1.5 rounded-full bg-icon-success" />
              <span class="text-text-weak">{connectedCount()}/{totalCount()} connected</span>
            </div>
          </Show>
        </div>

        {/* Search */}
        <div class="relative px-1 pb-2">
          <div class="absolute left-4 top-1/2 -translate-y-1/2 text-icon-weak pointer-events-none flex items-center justify-center">
            <Icon name="magnifying-glass" size="small" />
          </div>
          <input
            type="text"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            placeholder="Search servers..."
            class="w-full h-8 pl-8 pr-3 text-13-regular text-text-strong bg-surface-base rounded-md border border-border-base outline-none placeholder:text-text-weaker"
          />
        </div>

        {/* Server list */}
        <Show
          when={serverNames().length > 0}
          fallback={<EmptyState />}
        >
          <div class="flex flex-col gap-1.5">
            <For each={serverNames()}>
              {(name) => (
                <ServerRow
                  name={name}
                  status={mcpStatus()[name]}
                  expanded={expanded() === name}
                  onToggle={() => toggle(name)}
                />
              )}
            </For>
          </div>
        </Show>
      </div>
    </ScrollView>
  )
}
