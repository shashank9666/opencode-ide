import { For, Show, createSignal } from "solid-js"

export type Keybinding = { id: string; key: string; command: string; when?: string; source?: "user" | "extension" | "default" }

export default function KeybindingsPanel(props: { keybindings: Keybinding[]; setKeybindings: (v: Keybinding[]) => void }) {
  const [search, setSearch] = createSignal("")
  const filtered = () => props.keybindings.filter((k) =>
    k.command.toLowerCase().includes(search().toLowerCase()) || k.key.toLowerCase().includes(search().toLowerCase())
  )

  return (
    <div class="size-full flex flex-col bg-surface-base">
      <div class="px-4 py-3 border-b border-border-base shrink-0">
        <input
          type="text"
          placeholder="Search keybindings..."
          class="w-full px-3 py-1.5 text-13-regular bg-surface-base border border-border-base rounded-md outline-none focus:border-accent-base text-text-strong"
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
      </div>
      <div class="flex-1 overflow-y-auto">
        <For each={filtered()}>
          {(k) => (
            <div class="flex items-center justify-between px-4 py-1.5 border-b border-border-base/50 hover:bg-surface-raised-base-hover">
              <span class="text-13-regular text-text-strong flex-1 truncate">{k.command}</span>
              <div class="flex items-center gap-2">
                <Show when={k.source === "user"}>
                  <span class="text-11-regular text-accent-base bg-accent-base/10 px-1.5 py-0.5 rounded">user</span>
                </Show>
                <kbd class="px-2 py-0.5 bg-surface-raised-stronger-non-alpha border border-border-base rounded text-12-medium text-text-strong min-w-[3rem] text-center">
                  {k.key || "(none)"}
                </kbd>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}