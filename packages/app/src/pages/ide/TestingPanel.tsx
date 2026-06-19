import { For, Show, createSignal } from "solid-js"

type TestCase = { id: string; name: string; file: string; status: "passed" | "failed" | "skipped" | "running"; duration?: number; error?: string }

export default function TestingPanel(props: { onClose?: () => void }) {
  const [filter, setFilter] = createSignal<"all" | "passed" | "failed" | "skipped">("all")
  const [running, setRunning] = createSignal(false)
  const [tests, setTests] = createSignal<TestCase[]>([
    { id: "t1", name: "renders without crashing", file: "src/components/App.test.ts", status: "passed", duration: 12 },
    { id: "t2", name: "click increments count", file: "src/components/App.test.ts", status: "passed", duration: 8 },
    { id: "t3", name: "fetch calls endpoint", file: "src/utils/api.test.ts", status: "failed", duration: 45, error: "Expected 200, got 500" },
    { id: "t4", name: "helpers math is correct", file: "src/utils/helpers.test.ts", status: "passed", duration: 5 },
  ])

  const filtered = () => {
    const f = filter()
    if (f === "all") return tests()
    return tests().filter((t) => t.status === f)
  }
  const counts = () => ({
    all: tests().length,
    passed: tests().filter((t) => t.status === "passed").length,
    failed: tests().filter((t) => t.status === "failed").length,
    skipped: tests().filter((t) => t.status === "skipped").length,
  })

  const runAll = async () => {
    setRunning(true)
    await new Promise((r) => setTimeout(r, 800))
    setTests((prev) => prev.map((t) => ({ ...t, status: t.status === "failed" ? "running" : t.status })))
    await new Promise((r) => setTimeout(r, 400))
    setTests((prev) => prev.map((t) => t.status === "running" ? { ...t, status: "passed", duration: Math.floor(Math.random() * 30) + 1 } : t))
    setRunning(false)
  }

  const statusIcon = (s: string) => s === "passed" ? "✓" : s === "failed" ? "✗" : s === "running" ? "◌" : "○"
  const statusColor = (s: string) => s === "passed" ? "text-text-success-base" : s === "failed" ? "text-text-danger-base" : s === "running" ? "text-accent-base" : "text-text-weak"

  return (
    <div class="size-full flex flex-col bg-surface-base">
      <div class="flex items-center justify-between px-3 py-1.5 border-b border-border-base shrink-0" style={{ "min-height": "34px" }}>
        <span class="text-11-medium text-text-weaker uppercase tracking-wider">TESTING</span>
        <div class="flex items-center gap-0.5">
          <button
            class="px-2 py-0.5 text-12-medium rounded transition-colors disabled:opacity-50"
            classList={{ "bg-accent-base text-white hover:bg-accent-base-hover": !running(), "bg-text-weak text-white": running() }}
            onClick={runAll}
            disabled={running()}
          >
            {running() ? "Running..." : "Run All"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div class="flex items-center gap-1 px-3 py-1 border-b border-border-base text-12-regular">
        {(["all", "passed", "failed", "skipped"] as const).map((f) => (
          <button
            class="px-2 py-0.5 rounded transition-colors"
            classList={{ "bg-surface-raised-base-hover text-text-strong": filter() === f, "text-text-weak hover:text-text-strong": filter() !== f }}
            onClick={() => setFilter(f)}
          >
            {f}({counts()[f]})
          </button>
        ))}
      </div>

      {/* Test list */}
      <div class="flex-1 overflow-y-auto">
        <For each={filtered()}>
          {(test) => (
            <div
              class="flex items-center gap-2 px-3 py-1.5 border-b border-border-base/50 hover:bg-surface-raised-base-hover cursor-pointer"
              onClick={() => {}}
            >
              <span class={`text-12-medium ${statusColor(test.status)}`}>{statusIcon(test.status)}</span>
              <span class="text-12-regular flex-1 truncate">{test.name}</span>
              <span class="text-11-regular text-text-weaker">{test.duration ? `${test.duration}ms` : ""}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}