import { createEffect, createMemo, createSignal, For, Match, Show, Switch, onCleanup } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"

type CommandCategory = "files" | "editor" | "view" | "ai" | "git" | "terminal" | "settings" | "workspace" | "recent"

interface PaletteAction {
  id: string
  title: string
  description?: string
  category: CommandCategory
  keybind?: string
  icon?: string
  onSelect: () => void
}

const CATEGORY_LABELS: Record<CommandCategory, string> = {
  files: "Files",
  editor: "Editor",
  view: "View",
  ai: "AI",
  git: "Git",
  terminal: "Terminal",
  settings: "Settings",
  workspace: "Workspace",
  recent: "Recently Used",
}

const CATEGORY_ICONS: Record<CommandCategory, string> = {
  files: "open-file",
  editor: "code",
  view: "sidebar",
  ai: "brain",
  git: "branch",
  terminal: "terminal",
  settings: "settings-gear",
  workspace: "layout-left",
  recent: "clock",
}

const RECENT_KEY = "opencode-palette-recent"
function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}
function saveRecent(ids: string[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 20)))
}

export default function CommandPaletteV2(props: {
  open: boolean
  onClose: () => void
  commands: PaletteAction[]
  onSearch?: (query: string) => void
  onFileSearch?: (query: string) => Promise<string[]>
  onFileSelect?: (path: string) => void
  onGoToLine?: (line: number) => void
}) {
  const [query, setQuery] = createSignal("")
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  const [mode, setMode] = createSignal<"commands" | "files">("commands")
  const [fileResults, setFileResults] = createSignal<string[]>([])
  const [searching, setSearching] = createSignal(false)
  const [pinned, setPinned] = createSignal<Set<string>>(new Set())
  const [recentIds, setRecentIds] = createSignal<string[]>(loadRecent())
  let inputRef: HTMLInputElement | undefined
  let listRef: HTMLDivElement | undefined
  let searchTimer: ReturnType<typeof setTimeout> | undefined

  createEffect(() => {
    try {
      const raw = localStorage.getItem("opencode-palette-pins")
      if (raw) setPinned(new Set(JSON.parse(raw) as string[]))
    } catch {}
  })

  const trackRecent = (id: string) => {
    setRecentIds(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, 20)
      saveRecent(next)
      return next
    })
  }

  const togglePin = (id: string) => {
    setPinned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem("opencode-palette-pins", JSON.stringify([...next]))
      return next
    })
  }

  const filtered = createMemo(() => {
    if (mode() === "files") return []
    const q = query().toLowerCase().trim()

    const lineMatch = query().trim().match(/^[:#]?(\d+)$/)
    if (lineMatch && props.onGoToLine) {
      const lineNum = parseInt(lineMatch[1], 10)
      const goLine: PaletteAction = {
        id: "goToLine",
        title: `Go to Line ${lineNum}`,
        description: `Navigate to line ${lineNum} in the active editor`,
        category: "editor" as CommandCategory,
        icon: "arrow-down",
        onSelect: () => props.onGoToLine!(lineNum),
      }
      return [goLine]
    }

    const baseCmds = props.commands.filter(cmd => cmd.id !== "goToLine")

    const cmds = !q ? baseCmds : baseCmds.filter((cmd) => {
      const title = cmd.title.toLowerCase()
      const desc = cmd.description?.toLowerCase() ?? ""
      const cat = CATEGORY_LABELS[cmd.category].toLowerCase()
      return title.includes(q) || desc.includes(q) || cat.includes(q)
    })

    if (!q) {
      const recentSet = new Set(recentIds())
      const recentCmds = baseCmds.filter(cmd => recentSet.has(cmd.id)).slice(0, 5)
      if (recentCmds.length > 0) {
        return [...recentCmds, ...cmds.filter(cmd => !recentSet.has(cmd.id))]
      }
    }

    return cmds.slice(0, 50)
  })

  const grouped = createMemo(() => {
    const pinSet = pinned()
    const recentSet = new Set(recentIds())
    const pinGroup: PaletteAction[] = []
    const recentGroup: PaletteAction[] = []
    const normalGroups = new Map<CommandCategory, PaletteAction[]>()
    const q = query().toLowerCase().trim()
    const lineMatch = query().trim().match(/^[:#]?(\d+)$/)

    for (const cmd of filtered()) {
      if (lineMatch) {
        const existing = normalGroups.get(cmd.category) ?? []
        existing.push(cmd)
        normalGroups.set(cmd.category, existing)
      } else if (pinSet.has(cmd.id)) {
        pinGroup.push(cmd)
      } else if (!q && recentSet.has(cmd.id)) {
        recentGroup.push(cmd)
      } else {
        const existing = normalGroups.get(cmd.category) ?? []
        existing.push(cmd)
        normalGroups.set(cmd.category, existing)
      }
    }
    const result: [string, CommandCategory, PaletteAction[]][] = []
    if (pinGroup.length > 0) result.push(["Pinned", "files" as CommandCategory, pinGroup])
    if (recentGroup.length > 0 && q) result.push(["Recently Used", "recent" as CommandCategory, recentGroup])
    for (const [cat, cmds] of normalGroups) {
      result.push([CATEGORY_LABELS[cat], cat, cmds])
    }
    return result
  })

  const groupedItems = createMemo(() => {
    const items: PaletteAction[] = []
    for (const [, , group] of grouped()) {
      items.push(...group)
    }
    return items
  })

  const executeSelected = () => {
    if (mode() !== "commands") return
    const cmd = groupedItems()[selectedIndex()]
    if (cmd) {
      trackRecent(cmd.id)
      props.onClose()
      cmd.onSelect()
    }
  }

  createEffect(() => {
    if (props.open) {
      setSelectedIndex(0)
      setQuery("")
      setMode("commands")
      setFileResults([])
      setTimeout(() => inputRef?.focus(), 50)
    }
  })

  createEffect(() => {
    const idx = selectedIndex()
    if (!listRef) return
    const items = listRef.querySelectorAll("[data-command-item]")
    const el = items[idx] as HTMLElement | undefined
    if (el) el.scrollIntoView({ block: "nearest" })
  })

  const handleQueryInput = (value: string) => {
    setQuery(value)
    setSelectedIndex(0)
    props.onSearch?.(value)

    const lineMatch = value.trim().match(/^[:#]?(\d+)$/)
    if (lineMatch && props.onGoToLine) {
      setMode("commands")
      setFileResults([])
      return
    }

    if (mode() !== "files" || !props.onFileSearch) return

    clearTimeout(searchTimer)
    if (!value.trim()) {
      setFileResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    searchTimer = setTimeout(async () => {
      try {
        const results = await props.onFileSearch!(value)
        if (query() === value) {
          setFileResults(results)
        }
      } catch {
      } finally {
        setSearching(false)
      }
    }, 150)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const maxIndex = mode() === "files" ? fileResults().length - 1 : groupedItems().length - 1
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(Math.min(selectedIndex() + 1, maxIndex < 0 ? 0 : maxIndex))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(Math.max(selectedIndex() - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (mode() === "files") {
        const file = fileResults()[selectedIndex()]
        if (file) {
          props.onClose()
          props.onFileSelect?.(file)
        }
      } else {
        executeSelected()
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      props.onClose()
    }
  }

  return (
    <Show when={props.open}>
      {/* Backdrop */}
      <div
        class="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={props.onClose}
      >
        {/* Palette */}
        <div
          class="w-[660px] max-w-[90vw] overflow-hidden animate-in fade-in duration-150 ease-out"
          style={{
            background: "var(--surface-raised-base)",
            "border": "1px solid var(--border-base)",
            "border-radius": "16px",
            "box-shadow": "0 16px 48px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)",
            "backdrop-filter": "blur(2px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search header */}
          <div class="flex items-center gap-3 px-4 py-3" style={{ "border-bottom": "1px solid var(--border-muted)" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="color: var(--icon-weaker); shrink: 0;">
              <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11.5 11.5L16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              class="flex-1 bg-transparent text-14-regular outline-none"
              style="color: var(--text-base);"
              placeholder={mode() === "files" ? "Search files by name..." : "Search commands, files, symbols..."}
              value={query()}
              onInput={(e) => handleQueryInput(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
            />
            <Show when={query()}>
              <button
                type="button"
                class="size-6 flex items-center justify-center rounded-md transition-colors duration-75"
                style="color: var(--icon-weaker);"
                classList={{ "hover:bg-overlay-hover": true }}
                onClick={() => setQuery("")}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
              </button>
            </Show>
          </div>

          {/* Mode switcher */}
          <div class="flex items-center gap-1 px-3 py-1.5" style={{ "border-bottom": "1px solid var(--border-muted)", background: "var(--background-bg-deep)" }}>
            <button
              type="button"
              class="px-2.5 py-1 text-12-regular rounded-md transition-colors duration-75"
              classList={{
                "text-text-strong": mode() === "commands",
                "text-text-weaker hover:text-text-weak": mode() !== "commands",
              }}
              style={mode() === "commands" ? { background: "var(--background-bg-base)" } : {}}
              onClick={() => { setMode("commands"); setQuery(""); setFileResults([]) }}
            >
              Commands
            </button>
            <button
              type="button"
              class="px-2.5 py-1 text-12-regular rounded-md transition-colors duration-75"
              classList={{
                "text-text-strong": mode() === "files",
                "text-text-weaker hover:text-text-weak": mode() !== "files",
              }}
              style={mode() === "files" ? { background: "var(--background-bg-base)" } : {}}
              onClick={() => { setMode("files"); setQuery(""); setFileResults([]) }}
            >
              Files
            </button>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            class="max-h-[420px] overflow-y-auto py-1"
            style="scroll-padding: 8px;"
            onKeyDown={handleKeyDown}
          >
            <Show
              when={mode() === "files" ? fileResults().length > 0 : filtered().length > 0}
              fallback={
                <div class="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style="color: var(--icon-weaker); opacity: 0.3;">
                    <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M15 15L21 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <div style="color: var(--text-weaker); font-size: 13px;">
                    {mode() === "files"
                      ? (query() ? (searching() ? "Searching..." : "No matching files")
                          : "Type a file name to search")
                      : (query() ? "No matching commands" : "Type a command name")}
                  </div>
                </div>
              }
            >
              <Switch>
                <Match when={mode() === "files"}>
                  <For each={fileResults()}>
                    {(file, i) => {
                      const isSelected = () => i() === selectedIndex()
                      return (
                        <div
                          data-command-item
                          class="flex items-center gap-3 px-4 py-2 mx-2 rounded-lg cursor-pointer transition-all duration-75"
                          classList={{
                            "text-text-strong": isSelected(),
                            "text-text-base": !isSelected(),
                          }}
                          style={isSelected() ? { background: "var(--accent-base)", color: "white" } : {}}
                          onClick={() => {
                            setSelectedIndex(i())
                            props.onClose()
                            props.onFileSelect?.(file)
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="shrink-0" style="color: var(--icon-weaker);">
                            <path d="M2 4C2 2.89543 2.89543 2 4 2H7L9 4H12C13.1046 4 14 4.89543 14 6V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12V4Z" stroke="currentColor" stroke-width="1.3"/>
                          </svg>
                          <div class="flex-1 min-w-0">
                            <div class="text-13-regular truncate">{file.split("/").pop()}</div>
                            <div class="text-11-regular truncate" style="color: var(--text-weaker);">{file}</div>
                          </div>
                        </div>
                      )
                    }}
                  </For>
                </Match>
                <Match when={mode() === "commands"}>
                  <For each={grouped()}>
                    {([label, category, cmds]) => (
                      <div class="pb-0.5">
                        <div class="flex items-center gap-1.5 px-4 py-1 text-11-medium uppercase tracking-wider" style="color: var(--text-weaker); padding-top: 8px;">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="color: var(--icon-weaker);">
                            <Switch>
                              <Match when={category === "files"}><path d="M2 4C2 2.89543 2.89543 2 4 2H7L9 4H12C13.1046 4 14 4.89543 14 6V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12V4Z" stroke="currentColor" stroke-width="1.3"/></Match>
                              <Match when={category === "editor"}><path d="M4 4H12V12H4V4Z" stroke="currentColor" stroke-width="1.3"/><path d="M8 4V12" stroke="currentColor" stroke-width="1.3"/></Match>
                              <Match when={category === "ai"}><path d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M8 6L10 8L8 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></Match>
                              <Match when={category === "git"}><path d="M2 4C2 2.89543 2.89543 2 4 2H12C13.1046 2 14 2.89543 14 4V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12V4Z" stroke="currentColor" stroke-width="1.3"/><path d="M2 8H14" stroke="currentColor" stroke-width="1.3"/></Match>
                              <Match when={category === "terminal"}><path d="M2 4L6 8L2 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12H14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></Match>
                              <Match when={category === "settings"}><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 1.5V3.5M8 12.5V14.5M14.5 8H12.5M3.5 8H1.5M12.5 3.5L11 5M5 11L3.5 12.5M12.5 12.5L11 11M5 5L3.5 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></Match>
                              <Match when={category === "view"}><path d="M3 3H13V13H3V3Z" stroke="currentColor" stroke-width="1.3"/><path d="M3 7H13" stroke="currentColor" stroke-width="1.3"/><path d="M7 3V13" stroke="currentColor" stroke-width="1.3"/></Match>
                              <Match when={true}><path d="M2 4C2 2.89543 2.89543 2 4 2H7L9 4H12C13.1046 4 14 4.89543 14 6V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12V4Z" stroke="currentColor" stroke-width="1.3"/></Match>
                            </Switch>
                          </svg>
                          {label}
                        </div>
                        <For each={cmds}>
                          {(cmd, i) => {
                            const globalIndex = () => {
                              let count = 0
                              for (const [, , group] of grouped()) {
                                for (const item of group) {
                                  if (item === cmd) return count
                                  count++
                                }
                              }
                              return -1
                            }
                            const isSelected = () => globalIndex() === selectedIndex()
                            const isPinned = () => pinned().has(cmd.id)
                            return (
                              <div
                                data-command-item
                                class="flex items-center gap-3 px-4 py-2 mx-2 rounded-lg cursor-pointer transition-all duration-75 group"
                                classList={{
                                  "text-text-strong": isSelected(),
                                  "text-text-base": !isSelected(),
                                }}
                                style={isSelected() ? { background: "var(--accent-base)", color: "white" } : {}}
                                onClick={() => {
                                  const idx = globalIndex()
                                  if (idx === selectedIndex()) executeSelected()
                                  else setSelectedIndex(idx)
                                }}
                                onDblClick={executeSelected}
                              >
                                <Show when={cmd.icon}>
                                  <div class="size-4 flex items-center justify-center shrink-0" style="color: var(--icon-weaker);">
                                    <Icon name={cmd.icon as any} size="small" />
                                  </div>
                                </Show>
                                <div class="flex-1 min-w-0">
                                  <div class="text-13-regular truncate">{cmd.title}</div>
                                  <Show when={cmd.description && !isSelected()}>
                                    <div class="text-11-regular truncate" style="color: var(--text-weaker);">{cmd.description}</div>
                                  </Show>
                                </div>
                                <div class="flex items-center gap-1.5 shrink-0">
                                  <Show when={cmd.keybind}>
                                    <span class="px-1.5 py-0.5 text-11-medium rounded-md font-mono" style={{ background: isSelected() ? "rgba(255,255,255,0.15)" : "var(--surface-base)", border: isSelected() ? "1px solid transparent" : "1px solid var(--border-muted)", color: isSelected() ? "rgba(255,255,255,0.8)" : "var(--text-weaker)" }}>{cmd.keybind}</span>
                                  </Show>
                                  <button
                                    type="button"
                                    class="shrink-0 size-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-all duration-75"
                                    classList={{ "opacity-100!": isPinned() }}
                                    style="color: var(--icon-weaker);"
                                    onClick={(e) => { e.stopPropagation(); togglePin(cmd.id) }}
                                    title={isPinned() ? "Unpin" : "Pin"}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                      <path d="M6 1.5L7.5 4.5L10.5 5L8 7.5L8.5 11L6 9.5L3.5 11L4 7.5L1.5 5L4.5 4.5L6 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )
                          }}
                        </For>
                      </div>
                    )}
                  </For>
                </Match>
              </Switch>
            </Show>
          </div>

          {/* Footer hints */}
          <div class="flex items-center gap-3 px-4 py-2 text-11-regular" style={{ "border-top": "1px solid var(--border-muted)", background: "var(--background-bg-deep)", color: "var(--text-weaker)" }}>
            <span><kbd class="px-1 py-0.5 rounded text-11-medium" style={{ background: "var(--surface-base)", border: "1px solid var(--border-muted)" }}>↑↓</kbd> Navigate</span>
            <span><kbd class="px-1 py-0.5 rounded text-11-medium" style={{ background: "var(--surface-base)", border: "1px solid var(--border-muted)" }}>↵</kbd> Select</span>
            <Show when={props.onGoToLine}>
              <span><kbd class="px-1 py-0.5 rounded text-11-medium" style={{ background: "var(--surface-base)", border: "1px solid var(--border-muted)" }}>:42</kbd> Go to Line</span>
            </Show>
            <span class="ml-auto"><kbd class="px-1 py-0.5 rounded text-11-medium" style={{ background: "var(--surface-base)", border: "1px solid var(--border-muted)" }}>Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </Show>
  )
}

export type { PaletteAction, CommandCategory }
