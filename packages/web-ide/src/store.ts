import { createSignal, createMemo, createEffect, onCleanup } from "solid-js"
import type { FileNode, EditorFile, Panel, Terminal, Diagnostic, DebugBreakpoint, DebugSession, TestCase } from "./types"

// ── Mock file tree ──
const sampleTree: FileNode[] = [
  {
    path: "src", name: "src", type: "directory", expanded: true,
    children: [
      { path: "src/components", name: "components", type: "directory", expanded: true, children: [
        { path: "src/components/App.tsx", name: "App.tsx", type: "file" },
        { path: "src/components/Header.tsx", name: "Header.tsx", type: "file" },
        { path: "src/components/index.ts", name: "index.ts", type: "file" },
      ]},
      { path: "src/utils", name: "utils", type: "directory", children: [
        { path: "src/utils/helpers.ts", name: "helpers.ts", type: "file" },
        { path: "src/utils/api.ts", name: "api.ts", type: "file" },
      ]},
      { path: "src/App.tsx", name: "App.tsx", type: "file" },
      { path: "src/main.tsx", name: "main.tsx", type: "file" },
      { path: "src/index.css", name: "index.css", type: "file" },
    ],
  },
  { path: "public", name: "public", type: "directory", children: [
    { path: "public/index.html", name: "index.html", type: "file" },
    { path: "public/favicon.ico", name: "favicon.ico", type: "file" },
  ]},
  { path: "package.json", name: "package.json", type: "file" },
  { path: "tsconfig.json", name: "tsconfig.json", type: "file" },
  { path: "README.md", name: "README.md", type: "file" },
]

export function useFileTree() {
  const [tree, setTree] = createSignal<FileNode[]>(sampleTree)

  const findNode = (nodes: FileNode[], path: string): FileNode | undefined => {
    for (const n of nodes) {
      if (n.path === path) return n
      if (n.children) {
        const found = findNode(n.children, path)
        if (found) return found
      }
    }
    return undefined
  }

  const toggleExpand = (path: string) => {
    setTree((prev: FileNode[]) => {
      const clone: FileNode[] = JSON.parse(JSON.stringify(prev))
      const node = findNode(clone, path)
      if (node) node.expanded = !node.expanded
      return clone
    })
  }

  const refresh = () => setTree((prev: FileNode[]) => [...prev])

  return { tree, toggleExpand, refresh }
}

// ── Editor state ──
const FILE_CONTENTS: Record<string, string> = {
  "src/App.tsx": `import { createSignal, For, Show } from "solid-js"\nimport { render } from "solid-js/web"\nimport "./index.css"\n\nconst App = () => {\n  const [count, setCount] = createSignal(0)\n  return (\n    <div class="app">\n      <h1>Hello VS Code</h1>\n      <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>\n    </div>\n  )\n}\n\nexport default App\n`,
  "src/main.tsx": `import { render } from "solid-js/web"\nimport App from "./App"\n\nrender(() => <App />, document.getElementById("root")!)\n`,
  "src/index.css": `:root { font-family: Inter, system-ui, sans-serif; }\nbody { margin: 0; background: #1a1a2e; color: #eee; }\n`,
  "src/components/App.tsx": `export const App = () => {\n  return <div>App Component</div>\n}\n`,
  "src/components/Header.tsx": `export const Header = () => {\n  return <header>Header</header>\n}\n`,
  "src/components/index.ts": `export * from "./App"\nexport * from "./Header"\n`,
  "src/utils/helpers.ts": `export const add = (a: number, b: number) => a + b\nexport const mul = (a: number, b: number) => a * b\n`,
  "src/utils/api.ts": `export const fetchData = async () => {\n  const res = await fetch("/api")\n  return res.json()\n}\n`,
  "public/index.html": `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>Web IDE</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>\n`,
  "public/favicon.ico": "[binary content]",
  "package.json": JSON.stringify({ name: "web-ide", version: "1.0.0", scripts: { dev: "bun run src/main.tsx" } }, null, 2),
  "tsconfig.json": JSON.stringify({ compilerOptions: { target: "ES2022", module: "ESNext", jsx: "preserve", strict: true, moduleResolution: "bundler" } }, null, 2),
  "README.md": "# Web IDE\nA VS Code-level web IDE.\n",
}

export function useEditor() {
  const [files, setFiles] = createSignal<EditorFile[]>([])
  const [activePath, setActivePath] = createSignal<string>("")

  const load = (path: string) => {
    setFiles((prev: EditorFile[]) => {
      if (prev.find((f) => f.path === path)) return prev
      const content = FILE_CONTENTS[path] ?? ""
      const ext = path.slice(path.lastIndexOf("."))
      const lang = [".ts",".tsx"].includes(ext) ? "typescript" :
                   [".js",".jsx"].includes(ext) ? "javascript" :
                   ext === ".json" ? "json" : ext === ".css" ? "css" :
                   ext === ".html" ? "html" : ext === ".md" ? "markdown" : "plaintext"
      return [...prev, { path, content, language: lang, dirty: false }]
    })
    setActivePath(path)
  }

  const open = (path: string) => setActivePath(path)

  const close = (path: string) => {
    setFiles((prev: EditorFile[]) => prev.filter((f) => f.path !== path))
    if (activePath() === path) {
      const rest = files().filter((f) => f.path !== path)
      setActivePath(rest.length ? rest[rest.length - 1]!.path : "")
    }
  }

  const setContent = (path: string, content: string) => {
    setFiles((prev: EditorFile[]) => prev.map((f) => f.path === path ? { ...f, content, dirty: true } : f))
  }

  const markClean = (path: string) => {
    setFiles((prev: EditorFile[]) => prev.map((f) => f.path === path ? { ...f, dirty: false } : f))
  }

  const active = createMemo(() => files().find((f) => f.path === activePath()))
  const content = createMemo(() => active()?.content ?? "")
  const dirty = createMemo(() => active()?.dirty ?? false)

  return { files, activePath, active, load, open, close, setContent, markClean, content, dirty }
}

// ── Panel manager ──
const DEFAULT_PANELS: Panel[] = [
  { id: "explorer", label: "Explorer", icon: "📁", position: "left", visible: true, width: 280, order: 0 },
  { id: "search", label: "Search", icon: "🔍", position: "left", visible: false, width: 280, order: 1 },
  { id: "source-control", label: "Source Control", icon: "🌿", position: "left", visible: false, width: 300, order: 2 },
  { id: "extensions", label: "Extensions", icon: "🧩", position: "left", visible: false, width: 300, order: 3 },
  { id: "ai-chat", label: "AI Chat", icon: "💬", position: "right", visible: false, width: 320, order: 4 },
  { id: "debug", label: "Debug", icon: "🐛", position: "right", visible: false, width: 300, order: 5 },
  { id: "testing", label: "Testing", icon: "🧪", position: "right", visible: false, width: 300, order: 6 },
  { id: "terminal", label: "Terminal", icon: ">_", position: "bottom", visible: true, height: 220, order: 7 },
  { id: "problems", label: "Problems", icon: "⚠️", position: "bottom", visible: false, height: 220, order: 8 },
  { id: "output", label: "Output", icon: "📤", position: "bottom", visible: false, height: 180, order: 9 },
]

export function usePanels() {
  const [panels, setPanels] = createSignal<Panel[]>(DEFAULT_PANELS)
  const [floating, setFloating] = createSignal<Panel[]>([])

  const getByPosition = (pos: "left" | "right" | "bottom") =>
    createMemo(() => panels().filter((p: Panel) => p.position === pos).sort((a: Panel, b: Panel) => a.order - b.order))
  const visibleAt = (pos: "left" | "right" | "bottom") =>
    createMemo(() => getByPosition(pos)().find((p: Panel) => p.visible))

  const toggle = (id: string) => {
    setPanels((prev: Panel[]) => prev.map((p) => p.id === id ? { ...p, visible: !p.visible } : p))
  }
  const show = (id: string) => setPanels((prev: Panel[]) => prev.map((p) => p.id === id ? { ...p, visible: true } : p))
  const hide = (id: string) => setPanels((prev: Panel[]) => prev.map((p) => p.id === id ? { ...p, visible: false } : p))
  const move = (id: string, pos: Panel["position"]) => {
    setPanels((prev: Panel[]) => prev.map((p) => p.id === id ? { ...p, position: pos, visible: true } : p))
  }

  return { panels, floating, getByPosition, visibleAt, toggle, show, hide, move }
}

// ── Terminals ──
const initialTerminals: Terminal[] = [
  { id: "1", title: "PowerShell", shell: "PowerShell", cwd: "C:\\Users\\shett\\projects\\web-ide" },
]
let tid = 2
export function useTerminals() {
  const [list, setList] = createSignal<Terminal[]>(initialTerminals)
  const [active, setActive] = createSignal("1")

  const newTerminal = () => {
    const id = String(tid++)
    setList((prev) => [...prev, { id, title: "Terminal " + id, shell: "bash", cwd: "~" }])
    setActive(id)
  }

  return { list, active, setActive, newTerminal }
}

// ── Diagnostics / Problems ──
const sampleDiagnostics: Diagnostic[] = [
  { file: "src/App.tsx", line: 12, column: 10, severity: "error", message: "'foo' is not defined", source: "typescript" },
  { file: "src/utils/api.ts", line: 3, column: 1, severity: "warning", message: "Unused variable 'res'", source: "eslint" },
  { file: "src/components/Header.tsx", line: 5, column: 15, severity: "info", message: "Consider using React.memo", source: "eslint" },
]

export function useDiagnostics() {
  const [items, setItems] = createSignal<Diagnostic[]>(sampleDiagnostics)
  const [filter, setFilter] = createSignal<"all" | "errors" | "warnings" | "info">("all")

  const filtered = createMemo(() => {
    const f = filter()
    if (f === "all") return items()
    return items().filter((d: Diagnostic) => d.severity === f.replace(/s$/, ""))
  })

  const counts = createMemo(() => ({
    errors: items().filter((d) => d.severity === "error").length,
    warnings: items().filter((d) => d.severity === "warning").length,
    info: items().filter((d) => d.severity === "info").length,
  }))

  return { items, filter, setFilter, filtered, counts }
}

// ── Git (mock) ──
export function useGit() {
  const [branch, setBranch] = createSignal("main")
  const branches = ["main", "develop", "feature/ai-tools", "feature/testing", "fix/editor-bug"]
  const commits: { date: string; hash: string; author: string; message: string }[][] = [
    [
      { date: "2m ago", hash: "a1b2c3d", author: "You", message: "Fix editor line height" },
      { date: "15m ago", hash: "e4f5g6h", author: "You", message: "Add problem tracker" },
      { date: "1h ago", hash: "i7j8k9l", author: "You", message: "Implement panel manager" },
    ],
  ]

  const stage = (path: string) => console.log("stage", path)
  const unstage = (path: string) => console.log("unstage", path)
  const commit = (msg: string) => console.log("commit", msg)
  const push = () => console.log("push")
  const pull = () => console.log("pull")
  const checkout = (b: string) => setBranch(b)

  return { branch, setBranch, branches, commits, stage, unstage, commit, push, pull, checkout }
}

// ── Debug (mock) ──
let bpid = 1
export function useDebug() {
  const [session, setSession] = createSignal<DebugSession | undefined>(undefined)
  const [breakpoints, setBreakpoints] = createSignal<DebugBreakpoint[]>([])
  const [consoleLines, setConsoleLines] = createSignal<string[]>([])

  const start = (config?: { type: string; request: string; name: string }) => {
    setSession({
      id: "dbg-1",
      name: config?.name ?? "Launch",
      type: config?.type ?? "node",
      state: "running",
      breakpoints: breakpoints(),
      callStack: [{ id: "sf1", name: "main()", file: "src/main.tsx", line: 1, column: 1 }],
      variables: {},
      watchExpressions: [],
    })
    setConsoleLines(["Debug session started...", "Running src/main.tsx"])
  }

  const stop = () => {
    setSession(undefined)
    setConsoleLines([])
  }

  const toggleBreakpoint = (file: string, line: number) => {
    setBreakpoints((prev: DebugBreakpoint[]) => {
      const existing = prev.find((b) => b.file === file && b.line === line)
      if (existing) {
        return prev.filter((b) => !(b.file === file && b.line === line))
      }
      return [...prev, { id: `bp-${bpid++}`, file, line, enabled: true }]
    })
  }

  const addConsoleLine = (line: string) => setConsoleLines((prev: string[]) => [...prev, line])

  return { session, breakpoints, consoleLines, start, stop, toggleBreakpoint, addConsoleLine }
}

// ── Tests (mock) ──
const sampleTests: TestCase[] = [
  { id: "t1", name: "renders without crashing", file: "src/components/App.test.ts", status: "passed", duration: 12 },
  { id: "t2", name: "click increments count", file: "src/components/App.test.ts", status: "passed", duration: 8 },
  { id: "t3", name: "fetch calls endpoint", file: "src/utils/api.test.ts", status: "failed", duration: 45, error: "Expected 200, got 500" },
  { id: "t4", name: "helpers math is correct", file: "src/utils/helpers.test.ts", status: "passed", duration: 5 },
]

export function useTests() {
  const [tests, setTests] = createSignal<TestCase[]>(sampleTests)
  const [filter, setFilter] = createSignal<"all" | "passed" | "failed" | "skipped">("all")
  const [running, setRunning] = createSignal(false)

  const filtered = createMemo(() => {
    const f = filter()
    if (f === "all") return tests()
    return tests().filter((t: TestCase) => t.status === f)
  })

  const runAll = async () => {
    setRunning(true)
    await new Promise((r) => setTimeout(r, 800))
    setTests((prev: TestCase[]) => prev.map((t) => ({ ...t, status: t.status === "failed" ? "running" : t.status })))
    await new Promise((r) => setTimeout(r, 400))
    setTests((prev: TestCase[]) => prev.map((t) => t.status === "running" ? { ...t, status: "passed", duration: Math.floor(Math.random() * 30) + 1 } : t))
    setRunning(false)
  }

  return { tests, filter, setFilter, filtered, running, runAll }
}