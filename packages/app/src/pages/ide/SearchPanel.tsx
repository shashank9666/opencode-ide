import { createSignal, For, Show, createMemo } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Tooltip } from "@opencode-ai/ui/tooltip"

interface SubMatch {
  match: { text: string }
  start: number
  end: number
}

interface SearchResultItem {
  path: { text: string }
  lines: { text: string }
  line_number: number
  absolute_offset: number
  submatches: SubMatch[]
}

function HighlightedLine(props: { text: string; submatches: SubMatch[] }) {
  const line = props.text
  const matches = props.submatches ?? []

  if (matches.length === 0) {
    return <span style="color: var(--text-base);">{line.trim()}</span>
  }

  const segments: { text: string; highlight: boolean }[] = []
  const trimmed = line.trimStart()
  const trimOffset = line.length - trimmed.length

  let lastEnd = 0
  for (const m of matches) {
    const start = m.start - trimOffset
    const end = m.end - trimOffset
    if (start > lastEnd) {
      segments.push({ text: trimmed.slice(lastEnd, start), highlight: false })
    }
    segments.push({ text: trimmed.slice(Math.max(0, start), Math.max(0, end)), highlight: true })
    lastEnd = Math.max(0, end)
  }
  if (lastEnd < trimmed.length) {
    segments.push({ text: trimmed.slice(lastEnd), highlight: false })
  }

  return (
    <span class="font-mono truncate" style="color: var(--text-base);">
      <For each={segments}>
        {(seg) =>
          seg.highlight ? (
            <mark class="rounded-[2px] px-[1px]" style="background: rgba(249, 199, 79, 0.3); color: rgb(249, 199, 79);">{seg.text}</mark>
          ) : (
            <span>{seg.text}</span>
          )
        }
      </For>
    </span>
  )
}

export default function SearchPanel(props: {
  onSearch: (pattern: string) => Promise<SearchResultItem[]>
  onResultClick: (result: { path: string; line: number; column?: number }) => void
  onReplace?: (pattern: string, replacement: string) => Promise<void>
  onReplaceAll?: (pattern: string, replacement: string) => Promise<void>
  onSymbolSearch?: (pattern: string) => Promise<Array<{ name: string; kind: string; path: string; line: number }>>
}) {
  const [searchQuery, setSearchQuery] = createSignal("")
  const [replaceText, setReplaceText] = createSignal("")
  const [results, setResults] = createSignal<SearchResultItem[]>([])
  const [searching, setSearching] = createSignal(false)
  const [showReplace, setShowReplace] = createSignal(false)
  const [caseSensitive, setCaseSensitive] = createSignal(false)
  const [matchWholeWord, setMatchWholeWord] = createSignal(false)
  const [useRegex, setUseRegex] = createSignal(false)
  const [includePattern, setIncludePattern] = createSignal("")
  const [excludePattern, setExcludePattern] = createSignal("")
  const [showFilters, setShowFilters] = createSignal(false)
  const [collapsedAll, setCollapsedAll] = createSignal(false)
  const [collapsedFiles, setCollapsedFiles] = createSignal<Set<string>>(new Set())
  const [viewAsTree, setViewAsTree] = createSignal(false)
  const [searchMode, setSearchMode] = createSignal<"files" | "symbols">("files")
  const [symbolResults, setSymbolResults] = createSignal<Array<{ name: string; kind: string; path: string; line: number }>>([])
  const [selectedResultIndex, setSelectedResultIndex] = createSignal(-1)
  let searchInputRef: HTMLInputElement | undefined

  const groupedResults = createMemo(() => {
    const groups = new Map<string, SearchResultItem[]>()
    for (const r of results()) {
      const existing = groups.get(r.path.text) ?? []
      existing.push(r)
      groups.set(r.path.text, existing)
    }
    return [...groups.entries()]
  })

  const totalMatches = () => results().length
  const totalFiles = () => groupedResults().length

  const isFileCollapsed = (path: string) => {
    if (collapsedAll()) return true
    return collapsedFiles().has(path)
  }

  const toggleFileCollapse = (path: string) => {
    setCollapsedFiles(prev => {
      const next = new Set<string>(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const toggleCollapseAll = () => {
    const next = !collapsedAll()
    setCollapsedAll(next)
    if (!next) setCollapsedFiles(new Set<string>())
  }

  const performSearch = async () => {
    const q = searchQuery()
    if (!q) return
    setSearching(true)
    setCollapsedAll(false)
    setCollapsedFiles(new Set<string>())
    setSelectedResultIndex(-1)
    try {
      if (searchMode() === "symbols" && props.onSymbolSearch) {
        setResults([])
        const syms = await props.onSymbolSearch(q)
        setSymbolResults(syms ?? [])
      } else {
        setSymbolResults([])
        const result = await props.onSearch(q)
        setResults(result ?? [])
      }
    } catch {
      setResults([])
      setSymbolResults([])
    } finally {
      setSearching(false)
    }
  }

  const refreshSearch = () => {
    if (searchQuery()) performSearch()
  }

  const clearResults = () => {
    setSearchQuery("")
    setResults([])
    setSymbolResults([])
    setSelectedResultIndex(-1)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA"
    if (isInput) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedResultIndex(prev => Math.min(prev + 1, totalResultCount() - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedResultIndex(prev => Math.max(0, prev - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const idx = selectedResultIndex()
      if (idx < 0) return
      if (searchMode() === "symbols") {
        const sym = symbolResults()[idx]
        if (sym) props.onResultClick({ path: sym.path, line: sym.line })
      } else {
        const grouped = groupedResults()
        let count = 0
        for (const [, fileResults] of grouped) {
          for (const r of fileResults) {
            if (count === idx) {
              props.onResultClick({ path: r.path.text, line: r.line_number, column: r.submatches?.[0]?.start ?? 0 })
              return
            }
            count++
          }
        }
      }
    }
  }

  const totalResultCount = () => {
    if (searchMode() === "symbols") return symbolResults().length
    return results().length
  }

  const symbolKindIcon = (kind: string) => {
    switch (kind.toLowerCase()) {
      case "function":
      case "method":
        return "code"
      case "class":
      case "struct":
        return "layout"
      case "interface":
        return "layout-sidebar"
      case "variable":
      case "property":
        return "open-file"
      case "enum":
        return "bullet-list"
      case "module":
      case "namespace":
        return "folder"
      default:
        return "open-file"
    }
  }

  const getFilename = (path: string) => path.split("/").pop() ?? path

  return (
    <div class="size-full flex flex-col" style={{ background: "var(--background-bg-base)" }} onKeyDown={handleKeyDown}>
      {/* Header */}
      <div class="flex items-center justify-between px-3 py-[7px] shrink-0" style={{ "border-bottom": "1px solid var(--border-muted)" }}>
        <span class="text-11-medium uppercase tracking-wider" style="color: var(--text-weaker);">Search</span>
        <div class="flex items-center gap-1">
          <Show when={results().length > 0 || symbolResults().length > 0}>
            <Tooltip value="Refresh" placement="bottom">
              <IconButton icon="reset" variant="ghost" size="small" class="size-5" onClick={refreshSearch} aria-label="Refresh" />
            </Tooltip>
            <Show when={searchMode() === "files"}>
              <Tooltip value={collapsedAll() ? "Expand All" : "Collapse All"} placement="bottom">
                <IconButton icon="collapse" variant="ghost" size="small" class="size-5" classList={{ "text-accent-base": collapsedAll() }} onClick={toggleCollapseAll} aria-label="Collapse All" />
              </Tooltip>
              <Tooltip value={viewAsTree() ? "View as List" : "View as Tree"} placement="bottom">
                <IconButton icon={viewAsTree() ? "bullet-list" : "file-tree"} variant="ghost" size="small" class="size-5" onClick={() => setViewAsTree(!viewAsTree())} aria-label="Toggle view mode" />
              </Tooltip>
            </Show>
          </Show>
          <Tooltip value="Toggle Replace" placement="bottom">
            <IconButton icon="edit-small-2" variant="ghost" size="small" class="size-5" classList={{ "text-accent-base": showReplace() }} onClick={() => setShowReplace(!showReplace())} aria-label="Toggle Replace" />
          </Tooltip>
        </div>
      </div>

      {/* Search mode tabs */}
      <div class="flex items-center shrink-0" style={{ "border-bottom": "1px solid var(--border-muted)" }}>
        <button
          type="button"
          class="px-3 py-[5px] text-11-medium relative transition-colors duration-75"
          style={{ color: searchMode() === "files" ? "var(--text-base)" : "var(--text-weaker)" }}
          classList={{ "hover:text-text-base": searchMode() !== "files" }}
          onClick={() => { setSearchMode("files"); setSymbolResults([]) }}
        >
          <span class="flex items-center gap-1.5">Files</span>
          {searchMode() === "files" && <div class="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style="background: var(--accent-base);" />}
        </button>
        <button
          type="button"
          class="px-3 py-[5px] text-11-medium relative transition-colors duration-75"
          style={{ color: searchMode() === "symbols" ? "var(--text-base)" : "var(--text-weaker)" }}
          classList={{ "hover:text-text-base": searchMode() !== "symbols" }}
          onClick={() => { setSearchMode("symbols"); setResults([]) }}
        >
          <span class="flex items-center gap-1.5">Symbols</span>
          {searchMode() === "symbols" && <div class="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style="background: var(--accent-base);" />}
        </button>
      </div>

      {/* Search input */}
      <div class="p-2 shrink-0" style={{ "border-bottom": "1px solid var(--border-muted)" }}>
        <div class="flex gap-1 mb-1">
          <div class="flex-1 relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none" style="color: var(--icon-weaker);">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              class="w-full pl-7 pr-2 py-1.5 text-13-regular rounded-md outline-none"
              style={{ background: "var(--surface-base)", color: "var(--text-base)", border: "1px solid var(--border-muted)" }}
              placeholder={searchMode() === "symbols" ? "Search symbols..." : "Search files..."}
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  if (e.altKey) {
                    const idx = selectedResultIndex()
                    if (idx >= 0) {
                      if (searchMode() === "symbols") {
                        const sym = symbolResults()[idx]
                        if (sym) props.onResultClick({ path: sym.path, line: sym.line })
                      } else {
                        const grouped = groupedResults()
                        let count = 0
                        for (const [, fileResults] of grouped) {
                          for (const r of fileResults) {
                            if (count === idx) {
                              props.onResultClick({ path: r.path.text, line: r.line_number })
                              return
                            }
                            count++
                          }
                        }
                      }
                    }
                  } else {
                    performSearch()
                  }
                }
              }}
            />
            <Show when={searchQuery()}>
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-2 transition-colors duration-75"
                style="color: var(--icon-weaker);"
                classList={{ "hover:text-text-base": true }}
                onClick={() => { setSearchQuery(""); setResults([]) }}
                aria-label="Clear search"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
              </button>
            </Show>
          </div>
          <button
            type="button"
            class="size-7 flex items-center justify-center rounded-md transition-all duration-75"
            style={{ background: searchQuery() && results().length > 0 ? "var(--accent-base)" : "var(--surface-base)", color: searchQuery() && results().length > 0 ? "white" : "var(--icon-weaker)", border: searchQuery() && results().length > 0 ? "none" : "1px solid var(--border-muted)" }}
            onClick={performSearch}
            aria-label="Search"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
        </div>

        <Show when={showReplace()}>
          <div class="flex gap-1 mb-1">
            <input
              type="text"
              class="flex-1 px-2 py-1.5 text-13-regular rounded-md outline-none"
              style={{ background: "var(--surface-base)", color: "var(--text-base)", border: "1px solid var(--border-muted)" }}
              placeholder="Replace with..."
              value={replaceText()}
              onInput={(e) => setReplaceText(e.currentTarget.value)}
            />
            <button
              type="button"
              class="px-2 py-1 text-12-regular rounded-md transition-colors duration-75"
              style={{ background: "var(--surface-base)", color: "var(--text-muted)", border: "1px solid var(--border-muted)" }}
              classList={{ "hover:bg-overlay-hover hover:text-text-base": true }}
              onClick={() => props.onReplace?.(searchQuery(), replaceText())}
            >
              Replace
            </button>
            <button
              type="button"
              class="px-2 py-1 text-12-regular rounded-md transition-colors duration-75"
              style={{ background: "var(--surface-base)", color: "var(--text-muted)", border: "1px solid var(--border-muted)" }}
              classList={{ "hover:bg-overlay-hover hover:text-text-base": true }}
              onClick={() => props.onReplaceAll?.(searchQuery(), replaceText())}
            >
              All
            </button>
          </div>
        </Show>

        <Show when={showFilters()}>
          <div class="mt-1 flex flex-col gap-1">
            <input
              type="text"
              class="w-full px-2 py-1 text-12-regular rounded-md outline-none"
              style={{ background: "var(--surface-base)", color: "var(--text-base)", border: "1px solid var(--border-muted)" }}
              placeholder="Files to include (e.g. *.ts, src/**)"
              value={includePattern()}
              onInput={(e) => setIncludePattern(e.currentTarget.value)}
            />
            <input
              type="text"
              class="w-full px-2 py-1 text-12-regular rounded-md outline-none"
              style={{ background: "var(--surface-base)", color: "var(--text-base)", border: "1px solid var(--border-muted)" }}
              placeholder="Files to exclude (e.g. node_modules, dist)"
              value={excludePattern()}
              onInput={(e) => setExcludePattern(e.currentTarget.value)}
            />
          </div>
        </Show>

        <div class="flex items-center gap-2 mt-1">
          <button
            type="button"
            class="text-11-medium px-1.5 py-[2px] rounded transition-colors duration-75"
            style={{
              background: caseSensitive() ? "var(--accent-base)" : "var(--surface-base)",
              color: caseSensitive() ? "white" : "var(--text-weaker)",
              border: "1px solid var(--border-muted)",
            }}
            onClick={() => setCaseSensitive(!caseSensitive())}
            title="Case Sensitive"
          >
            Aa
          </button>
          <button
            type="button"
            class="text-11-medium px-1.5 py-[2px] rounded transition-colors duration-75"
            style={{
              background: matchWholeWord() ? "var(--accent-base)" : "var(--surface-base)",
              color: matchWholeWord() ? "white" : "var(--text-weaker)",
              border: "1px solid var(--border-muted)",
            }}
            onClick={() => setMatchWholeWord(!matchWholeWord())}
            title="Match Whole Word"
          >
            ab
          </button>
          <button
            type="button"
            class="text-11-medium px-1.5 py-[2px] rounded transition-colors duration-75"
            style={{
              background: useRegex() ? "var(--accent-base)" : "var(--surface-base)",
              color: useRegex() ? "white" : "var(--text-weaker)",
              border: "1px solid var(--border-muted)",
            }}
            onClick={() => setUseRegex(!useRegex())}
            title="Use Regular Expression"
          >
            .*
          </button>
          <button
            type="button"
            class="text-11-medium px-1.5 py-[2px] rounded transition-colors duration-75"
            style={{ background: "var(--surface-base)", color: showFilters() ? "var(--accent-base)" : "var(--text-weaker)", border: "1px solid var(--border-muted)" }}
            onClick={() => setShowFilters(!showFilters())}
            title="Toggle Filters"
          >
            ...
          </button>
          <div class="flex-1" />
          <Show when={searchMode() === "files" && results().length > 0}>
            <span class="text-11-regular" style="color: var(--text-weaker);">{totalMatches()} in {totalFiles()} file{totalFiles() !== 1 ? "s" : ""}</span>
          </Show>
          <Show when={searchMode() === "symbols" && symbolResults().length > 0}>
            <span class="text-11-regular" style="color: var(--text-weaker);">{symbolResults().length} symbol{symbolResults().length !== 1 ? "s" : ""}</span>
          </Show>
          <Show when={(searchMode() === "files" && results().length > 0) || (searchMode() === "symbols" && symbolResults().length > 0)}>
            <button
              type="button"
              class="text-11-medium px-1.5 py-[2px] rounded transition-colors duration-75"
              style={{ color: "var(--text-weaker)" }}
              classList={{ "hover:bg-overlay-hover hover:text-text-base": true }}
              onClick={clearResults}
            >
              Clear
            </button>
          </Show>
        </div>
      </div>

      {/* Results */}
      <div class="flex-1 overflow-y-auto min-h-0">
        <Show when={searching()}>
          <div class="flex items-center justify-center py-4 text-13-regular gap-2" style="color: var(--text-muted);">
            <span class="animate-pulse">Searching...</span>
          </div>
        </Show>

        <Show when={!searching() && searchMode() === "symbols" && symbolResults().length > 0}>
          <For each={symbolResults()}>
            {(sym, i) => (
              <button
                type="button"
                class="w-full flex items-center gap-2 px-3 py-1.5 text-12-regular cursor-pointer text-left transition-colors duration-75 group"
                style={{ background: i() === selectedResultIndex() ? "var(--accent-base)" : "transparent", color: i() === selectedResultIndex() ? "white" : "var(--text-muted)" }}
                classList={{ "hover:bg-overlay-hover": i() !== selectedResultIndex() }}
                onClick={() => props.onResultClick({ path: sym.path, line: sym.line })}
              >
                <Icon name={symbolKindIcon(sym.kind) as any} size="small" class="shrink-0" style="color: var(--icon-weaker);" />
                <div class="flex-1 min-w-0">
                  <span style={{ color: i() === selectedResultIndex() ? "white" : "var(--text-base)" }}>{sym.name}</span>
                  <span class="ml-1.5 text-11-regular" style="color: var(--text-weaker);">{sym.kind}</span>
                </div>
                <span class="text-11-regular truncate shrink-0 max-w-40" style="color: var(--text-weaker);">{getFilename(sym.path)}:{sym.line}</span>
              </button>
            )}
          </For>
        </Show>

        <Show when={!searching() && searchMode() === "files" && results().length > 0}>
          <For each={groupedResults()}>
            {([path, fileResults]) => (
              <div>
                <button
                  type="button"
                  class="w-full flex items-center gap-1.5 px-2 py-[3px] text-12-medium transition-colors duration-75 cursor-pointer group"
                  style={{ color: "var(--text-base)" }}
                  classList={{ "hover:bg-overlay-hover": true }}
                  onClick={() => toggleFileCollapse(path)}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" class="shrink-0" style="color: var(--icon-weaker);">
                    <path d={isFileCollapsed(path) ? "M3.5 2L6.5 5L3.5 8" : "M2 3.5L5 6.5L8 3.5"} stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="shrink-0" style="color: var(--icon-weaker);">
                    <path d="M2 4C2 2.89543 2.89543 2 4 2H7L9 4H12C13.1046 4 14 4.89543 14 6V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12V4Z" stroke="currentColor" stroke-width="1.3"/>
                  </svg>
                  <span class="truncate flex-1 text-left" title={path}>{getFilename(path)}</span>
                  <span class="shrink-0 text-11-medium px-1.5 py-[1px] tabular-nums" style={{ background: "var(--accent-base)", color: "white", "border-radius": "999px" }}>
                    {fileResults.length}
                  </span>
                </button>
                <Show when={!isFileCollapsed(path)}>
                  <For each={fileResults}>
                    {(result) => {
                      const col = result.submatches?.[0]?.start ?? 0
                      return (
                        <button
                          type="button"
                          class="w-full flex items-start gap-2 px-4 py-[2px] text-12-regular cursor-pointer text-left transition-colors duration-75 group"
                          style="color: var(--text-muted);"
                          classList={{ "hover:bg-overlay-hover": true }}
                          onClick={() => props.onResultClick({ path: result.path.text, line: result.line_number, column: col + 1 })}
                        >
                          <span class="shrink-0 w-8 text-right tabular-nums text-11-regular mt-0.5" style="color: var(--text-weaker);">{result.line_number}</span>
                          <div class="flex-1 min-w-0 overflow-hidden">
                            <HighlightedLine text={result.lines.text} submatches={result.submatches} />
                          </div>
                        </button>
                      )
                    }}
                  </For>
                </Show>
              </div>
            )}
          </For>
        </Show>

        <Show when={!searching() && searchQuery() && (searchMode() === "files" ? results().length === 0 : symbolResults().length === 0)}>
          <div class="flex flex-col items-center justify-center py-8 text-13-regular gap-2" style="color: var(--text-weaker);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--icon-weaker); opacity: 0.4;">
              <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
              <path d="M15 15L21 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>No results found</span>
            <span class="text-12-regular">for "{searchQuery()}"</span>
          </div>
        </Show>
        <Show when={!searching() && !searchQuery()}>
          <div class="flex flex-col items-center justify-center py-8 text-13-regular gap-2 px-4 text-center" style="color: var(--text-weaker);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--icon-weaker); opacity: 0.4;">
              <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
              <path d="M15 15L21 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{searchMode() === "symbols" ? "Search for symbols" : "Search across your project files"}</span>
            <span class="text-12-regular">
              {searchMode() === "symbols" ? "Search for functions, classes, variables..." : "Type a search term and press Enter"}
            </span>
          </div>
        </Show>
      </div>
    </div>
  )
}
