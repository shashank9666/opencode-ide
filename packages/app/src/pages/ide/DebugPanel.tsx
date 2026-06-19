import { For, Show, createSignal } from "solid-js"

type DebugBreakpoint = { id: string; file: string; line: number; enabled: boolean; condition?: string }

export default function DebugPanel(props: { onClose?: () => void }) {
  const [running, setRunning] = createSignal(false)
  const [breakpoints, setBreakpoints] = createSignal<DebugBreakpoint[]>([
    { id: "bp1", file: "src/App.tsx", line: 12, enabled: true, condition: "" },
  ])
  const [consoleLines, setConsoleLines] = createSignal<string[]>([
    "Debug session started...",
    "Breakpoint hit at src/App.tsx:12",
  ])

  const toggle = (id: string) => setBreakpoints((prev) => prev.map((b) => b.id === id ? { ...b, enabled: !b.enabled } : b))

  return (
    <div class="size-full flex flex-col bg-surface-base">
      <div class="flex items-center justify-between px-3 py-1.5 border-b border-border-base shrink-0" style={{ "min-height": "34px" }}>
        <span class="text-11-medium text-text-weaker uppercase tracking-wider">DEBUG</span>
        <div class="flex items-center gap-0.5">
          <Show when={!running()}>
            <button class="px-2 py-0.5 text-12-medium bg-accent-base text-white rounded hover:bg-accent-base-hover transition-colors" onClick={() => setRunning(true)}>▶ Run</button>
          </Show>
          <Show when={running()}>
            <button class="px-2 py-0.5 text-12-medium bg-text-danger-base text-white rounded hover:bg-text-danger-hover transition-colors" onClick={() => setRunning(false)}>■ Stop</button>
          </Show>
          <button class="px-2 py-0.5 text-12-medium bg-surface-raised-base border border-border-base rounded hover:bg-surface-raised-base-hover transition-colors" onClick={() => { setBreakpoints([]); setConsoleLines([]); setRunning(false) }}>Clear</button>
        </div>
      </div>

      <div class="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Breakpoints */}
        <div class="border-b border-border-base">
          <div class="px-3 py-1 text-11-medium text-text-weaker uppercase tracking-wider">Breakpoints</div>
          <Show when={breakpoints().length === 0}>
            <div class="px-3 py-2 text-12-regular text-text-weak">No breakpoints</div>
          </Show>
          <For each={breakpoints()}>
            {(bp) => (
              <div class="flex items-center gap-2 px-3 py-1 hover:bg-surface-raised-base-hover cursor-pointer" onClick={() => toggle(bp.id)}>
                <div class={`w-2 h-2 rounded-full ${bp.enabled ? "bg-text-danger-base" : "bg-text-weak"}`} />
                <span class="text-12-medium truncate flex-1">{getFilename(bp.file)}:{bp.line}</span>
                <Show when={bp.condition}>
                  <span class="text-11-regular text-text-weaker italic truncate max-w-24">{bp.condition}</span>
                </Show>
              </div>
            )}
          </For>
        </div>

        {/* Call Stack */}
        <div class="border-b border-border-base">
          <div class="px-3 py-1 text-11-medium text-text-weaker uppercase tracking-wider">Call Stack</div>
          <div class="px-3 py-1 text-12-regular hover:bg-surface-raised-base-hover cursor-pointer">
            <span class="text-accent-base">▶</span> main (src/main.tsx:1)
          </div>
          <div class="px-3 py-1 pl-6 text-12-regular hover:bg-surface-raised-base-hover cursor-pointer">
            App (src/components/App.tsx:3)
          </div>
        </div>

        {/* Variables */}
        <div class="border-b border-border-base">
          <div class="px-3 py-1 text-11-medium text-text-weaker uppercase tracking-wider">Variables</div>
          <div class="px-3 py-1 text-12-regular">
            <div class="flex gap-2"><span class="text-text-weak">count</span><span class="text-text-strong">0</span></div>
          </div>
        </div>

        {/* Watch */}
        <div class="border-b border-border-base">
          <div class="px-3 py-1 text-11-medium text-text-weaker uppercase tracking-wider">Watch</div>
          <div class="px-3 py-1 text-12-regular text-text-weak italic">No watch expressions</div>
        </div>

        {/* Console */}
        <div class="flex-1 min-h-0 flex flex-col">
          <div class="px-3 py-1 text-11-medium text-text-weaker uppercase tracking-wider border-t border-border-base">Debug Console</div>
          <div class="flex-1 overflow-y-auto p-2 font-mono text-12-regular bg-surface-raised-stronger-non-alpha">
            <For each={consoleLines()}>
              {(line) => <div class="py-0.5 border-b border-border-base/50">{line}</div>}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}

function getFilename(path: string) {
  return path.split("/").pop() ?? path
}