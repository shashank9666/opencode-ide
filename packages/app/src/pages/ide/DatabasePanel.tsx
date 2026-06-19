import { For, createSignal } from "solid-js"

type Table = { name: string; rows: number; size: string }

export default function DatabasePanel() {
  const [tables] = createSignal<Table[]>([
    { name: "users", rows: 1240, size: "3.2 MB" },
    { name: "sessions", rows: 856, size: "1.8 MB" },
    { name: "messages", rows: 15420, size: "28.4 MB" },
    { name: "projects", rows: 45, size: "128 KB" },
    { name: "settings", rows: 12, size: "48 KB" },
  ])

  return (
    <div class="size-full flex flex-col bg-surface-base">
      <div class="flex items-center justify-between px-3 py-1.5 border-b border-border-base shrink-0" style={{ "min-height": "34px" }}>
        <span class="text-11-medium text-text-weaker uppercase tracking-wider">DATABASE</span>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div class="px-3 py-1 text-11-medium text-text-weaker uppercase tracking-wider border-b border-border-base">Tables</div>
        <For each={tables()}>
          {(t) => (
            <div class="flex items-center justify-between px-3 py-1.5 border-b border-border-base/50 hover:bg-surface-raised-base-hover cursor-pointer">
              <div class="flex items-center gap-2">
                <span class="text-12">📊</span>
                <span class="text-12-medium text-text-strong">{t.name}</span>
              </div>
              <span class="text-11-regular text-text-weaker">{t.rows.toLocaleString()} rows · {t.size}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}