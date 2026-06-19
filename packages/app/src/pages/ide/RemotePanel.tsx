import { For, Show, createSignal } from "solid-js"

type RemoteTarget = { id: string; name: string; type: string; status: "connected" | "disconnected" }

export default function RemotePanel() {
  const [targets] = createSignal<RemoteTarget[]>([
    { id: "1", name: "WSL: Ubuntu", type: "WSL", status: "connected" },
    { id: "2", name: "Production Server", type: "SSH", status: "disconnected" },
    { id: "3", name: "Docker Container", type: "Container", status: "disconnected" },
  ])

  return (
    <div class="size-full flex flex-col bg-surface-base">
      <div class="flex items-center justify-between px-3 py-1.5 border-b border-border-base shrink-0" style={{ "min-height": "34px" }}>
        <span class="text-11-medium text-text-weaker uppercase tracking-wider">REMOTE EXPLORER</span>
      </div>
      <div class="flex-1 overflow-y-auto p-2">
        <For each={targets()}>
          {(t) => (
            <div class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-raised-base-hover cursor-pointer">
              <div class={`w-2 h-2 rounded-full ${t.status === "connected" ? "bg-text-success-base" : "bg-text-weak"}`} />
              <div class="flex-1 min-w-0">
                <div class="text-12-medium text-text-strong truncate">{t.name}</div>
                <div class="text-11-regular text-text-weaker">{t.type}</div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}