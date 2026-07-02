import { type JSX, For, Show, createSignal, createMemo } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import type { BottomPanelTab } from "./ActivityBar"

export { type BottomPanelTab } from "./ActivityBar"

type TabConfig = {
  id: BottomPanelTab
  label: string
  icon: string
}

const TABS: TabConfig[] = [
  { id: "terminal", label: "TERMINAL", icon: "terminal" },
  { id: "problems", label: "PROBLEMS", icon: "circle-x" },
  { id: "output", label: "OUTPUT", icon: "console" },
  { id: "debug-console", label: "DEBUG CONSOLE", icon: "window-cursor" },
]

export default function BottomPanel(props: {
  activeTab: BottomPanelTab
  height: number
  onTabChange: (tab: BottomPanelTab) => void
  onClose: () => void
  onNewTerminal?: (profile?: string) => void
  onSplitTerminal?: () => void
  onKillTerminal?: () => void
  isTerminalSplit?: boolean
  onMaximize?: () => void
  showHistory?: boolean
  onToggleHistory?: () => void
  onResizeStart?: (e: MouseEvent) => void
  children: (tab: BottomPanelTab) => JSX.Element
}) {
  return (
    <div
      class="flex flex-col shrink-0 relative"
      style={{ height: `${props.height}px`, background: "var(--background-bg-base)" }}
    >
      <div
        class="absolute top-0 left-0 right-0 h-[3px] cursor-row-resize -mt-px z-10 transition-colors duration-100 hover:bg-accent-base/40"
        onMouseDown={props.onResizeStart}
      />
      {/* Tabs bar */}
      <div class="flex items-center justify-between shrink-0" style={{ height: "35px", background: "var(--background-bg-deep)", "border-bottom": "1px solid var(--border-muted)" }}>
        <div class="flex items-center h-full gap-0">
          <For each={TABS}>
            {(tab) => (
              <button
                type="button"
                class="flex items-center gap-1.5 px-3 h-full text-11-medium whitespace-nowrap relative tracking-wide uppercase transition-colors duration-75"
                style={{
                  color: props.activeTab === tab.id ? "var(--text-base)" : "var(--text-weaker)",
                }}
                classList={{ "hover:text-text-base": props.activeTab !== tab.id }}
                onClick={() => props.onTabChange(tab.id)}
              >
                <Show when={props.activeTab === tab.id}>
                  <div class="absolute top-0 left-0 right-0 h-[2px] rounded-b-full" style={{ background: "var(--accent-base)" }} />
                </Show>
                <span>{tab.label}</span>
              </button>
            )}
          </For>
        </div>
        <div class="flex items-center gap-0.5 pr-2" style="color: var(--icon-weaker);">
          <Show when={props.activeTab === "terminal"}>
            <DropdownMenu placement="bottom-end">
              <Tooltip value="New Terminal" placement="top">
                <DropdownMenu.Trigger as="div">
                  <button class="size-6 flex items-center justify-center rounded-md transition-all duration-75 hover:bg-overlay-hover" style="color: var(--icon-weaker);">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5V12.5M1.5 7H12.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                  </button>
                </DropdownMenu.Trigger>
              </Tooltip>
              <DropdownMenu.Portal>
                <DropdownMenu.Content class="min-w-[200px]">
                  <DropdownMenu.Item onSelect={() => props.onNewTerminal?.()}>
                    <DropdownMenu.ItemLabel>New Terminal</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => props.onSplitTerminal?.()}>
                    <DropdownMenu.ItemLabel>Split Terminal</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onSelect={() => props.onNewTerminal?.("PowerShell")}>
                    <DropdownMenu.ItemLabel>PowerShell</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => props.onNewTerminal?.("Command Prompt")}>
                    <DropdownMenu.ItemLabel>Command Prompt</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => props.onNewTerminal?.("Git Bash")}>
                    <DropdownMenu.ItemLabel>Git Bash</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => props.onNewTerminal?.("WSL")}>
                    <DropdownMenu.ItemLabel>WSL</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => props.onNewTerminal?.("JavaScript Debug Terminal")}>
                    <DropdownMenu.ItemLabel>JavaScript Debug Terminal</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu>
            <div class="w-px h-3" style={{ background: "var(--border-muted)" }} />
            <Tooltip value={props.isTerminalSplit ? "Unsplit Terminal" : "Split Terminal"} placement="top">
              <button class="size-6 flex items-center justify-center rounded-md transition-all duration-75 hover:bg-overlay-hover" style="color: var(--icon-weaker);" onClick={props.onSplitTerminal}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 2.5H13C13.8284 2.5 14.5 3.17157 14.5 4V12C14.5 12.8284 13.8284 13.5 13 13.5H3C2.17157 13.5 1.5 12.8284 1.5 12V4C1.5 3.17157 2.17157 2.5 3 2.5Z" stroke="currentColor" stroke-width="1.3"/><path d="M8.5 2.5V13.5" stroke="currentColor" stroke-width="1.3"/></svg>
              </button>
            </Tooltip>
            <Tooltip value="Command History" placement="top">
              <button
                class="size-6 flex items-center justify-center rounded-md transition-all duration-75 hover:bg-overlay-hover"
                style={{ color: props.showHistory ? "var(--accent-base)" : "var(--icon-weaker)" }}
                onClick={props.onToggleHistory}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 5V8.5L10 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
              </button>
            </Tooltip>
            <Tooltip value="Kill Terminal" placement="top">
              <button class="size-6 flex items-center justify-center rounded-md transition-all duration-75 hover:bg-overlay-hover" style="color: var(--icon-weaker);" onClick={props.onKillTerminal}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M5 4V2.5H11V4M3 4V12.5C3 13.3284 3.67157 14 4.5 14H11.5C12.3284 14 13 13.3284 13 12.5V4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </Tooltip>
            <div class="w-px h-3" style={{ background: "var(--border-muted)" }} />
          </Show>
          <Tooltip value="Maximize Panel Size" placement="top">
            <button class="size-6 flex items-center justify-center rounded-md transition-all duration-75 hover:bg-overlay-hover" style="color: var(--icon-weaker);" onClick={props.onMaximize}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 6V2H6M14 10V14H10M2 10V14H6M14 6V2H10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </Tooltip>
          <Tooltip value="Close Panel" placement="top">
            <button
              class="size-6 flex items-center justify-center rounded-md transition-all duration-75 hover:bg-overlay-hover"
              style="color: var(--icon-weaker);"
              onClick={props.onClose}
              aria-label="Close Panel"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Content area */}
      <div class="flex-1 min-h-0 overflow-auto" style={{ background: "var(--background-bg-base)" }}>
        {props.children(props.activeTab)}
      </div>
    </div>
  )
}

export function ProblemsTab(props: {
  problems: Array<{ file: string; line: number; column: number; message: string; severity: "error" | "warning" | "info"; code?: string }>
  counts: { errors: number; warnings: number; info: number }
  filter: { errors: boolean; warnings: boolean; info: boolean }
  onFilterChange: (filter: { errors: boolean; warnings: boolean; info: boolean }) => void
  onProblemClick?: (problem: { file: string; line: number; column: number }) => void
}) {
  const [collapsedFiles, setCollapsedFiles] = createSignal<Set<string>>(new Set())

  const toggleFile = (file: string) => {
    const next = new Set(collapsedFiles())
    if (next.has(file)) next.delete(file)
    else next.add(file)
    setCollapsedFiles(next)
  }

  const groupedProblems = createMemo(() => {
    const groups: Record<string, typeof props.problems> = {}
    let filtered = props.problems

    filtered = filtered.filter(p => {
      if (p.severity === "error" && !props.filter.errors) return false
      if (p.severity === "warning" && !props.filter.warnings) return false
      if (p.severity === "info" && !props.filter.info) return false
      return true
    })

    for (const p of filtered) {
      if (!groups[p.file]) groups[p.file] = []
      groups[p.file].push(p)
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  })

  return (
    <div class="size-full flex flex-col font-sans">
      {/* Filter bar */}
      <div class="flex items-center gap-2 px-3 py-[5px] shrink-0" style={{ background: "var(--background-bg-deep)", "border-bottom": "1px solid var(--border-muted)" }}>
        <button
          type="button"
          class="flex items-center gap-1 px-2 py-[2px] rounded text-12-regular transition-colors duration-75"
          classList={{
            "text-text-strong": props.filter.errors,
            "text-text-weaker hover:text-text-weak": !props.filter.errors,
          }}
          style={props.filter.errors ? { background: "var(--overlay-hover)" } : {}}
          onClick={() => props.onFilterChange({ ...props.filter, errors: !props.filter.errors })}
        >
          <span class="w-2 h-2 rounded-full" style="background: var(--state-danger);" />
          {props.counts.errors} Errors
        </button>
        <button
          type="button"
          class="flex items-center gap-1 px-2 py-[2px] rounded text-12-regular transition-colors duration-75"
          classList={{
            "text-text-strong": props.filter.warnings,
            "text-text-weaker hover:text-text-weak": !props.filter.warnings,
          }}
          style={props.filter.warnings ? { background: "var(--overlay-hover)" } : {}}
          onClick={() => props.onFilterChange({ ...props.filter, warnings: !props.filter.warnings })}
        >
          <span class="w-2 h-2 rounded-full" style="background: var(--state-warning);" />
          {props.counts.warnings} Warnings
        </button>
        <button
          type="button"
          class="flex items-center gap-1 px-2 py-[2px] rounded text-12-regular transition-colors duration-75"
          classList={{
            "text-text-strong": props.filter.info,
            "text-text-weaker hover:text-text-weak": !props.filter.info,
          }}
          style={props.filter.info ? { background: "var(--overlay-hover)" } : {}}
          onClick={() => props.onFilterChange({ ...props.filter, info: !props.filter.info })}
        >
          <span class="w-2 h-2 rounded-full" style="background: var(--state-info);" />
          {props.counts.info} Info
        </button>
      </div>
      <div class="flex-1 overflow-auto p-0">
        <Show
          when={groupedProblems().length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center h-full gap-2" style="color: var(--text-weaker); font-size: 13px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--icon-weaker); opacity: 0.4;">
                <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span>No problems detected</span>
            </div>
          }
        >
          <div class="py-0.5">
            <For each={groupedProblems()}>
              {([file, problems]) => {
                const isCollapsed = collapsedFiles().has(file)
                const fileErrors = problems.filter(p => p.severity === "error").length
                const fileWarnings = problems.filter(p => p.severity === "warning").length
                return (
                  <div>
                    {/* File Header */}
                    <div
                      class="flex items-center gap-1.5 px-2 py-[3px] text-13-regular transition-colors duration-75 cursor-pointer"
                      style={{ color: "var(--text-muted)" }}
                      classList={{ "hover:bg-overlay-hover": true }}
                      onClick={() => toggleFile(file)}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" class="shrink-0" style="color: var(--icon-weaker);">
                        <path d={isCollapsed ? "M3.5 2L6.5 5L3.5 8" : "M2 3.5L5 6.5L8 3.5"} stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="shrink-0" style="color: var(--icon-weaker);">
                        <path d="M2 4C2 2.89543 2.89543 2 4 2H7L9 4H12C13.1046 4 14 4.89543 14 6V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12V4Z" stroke="currentColor" stroke-width="1.3"/>
                      </svg>
                      <div class="flex items-baseline gap-2 min-w-0 flex-1">
                        <span class="text-text-strong font-medium truncate">{file.split('/').pop()}</span>
                        <span class="text-12-regular truncate" style="color: var(--text-weaker);">{file.substring(0, file.lastIndexOf('/'))}</span>
                      </div>
                      <div class="flex items-center gap-2 shrink-0 pr-2">
                        <Show when={fileErrors > 0}>
                          <div class="flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full" style="background: var(--state-danger);" />
                            <span class="text-12-regular" style="color: var(--text-weaker);">{fileErrors}</span>
                          </div>
                        </Show>
                        <Show when={fileWarnings > 0}>
                          <div class="flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full" style="background: var(--state-warning);" />
                            <span class="text-12-regular" style="color: var(--text-weaker);">{fileWarnings}</span>
                          </div>
                        </Show>
                      </div>
                    </div>
                    {/* File Problems */}
                    <Show when={!isCollapsed}>
                      <For each={problems}>
                        {(problem) => (
                          <div
                            class="flex items-start gap-2 pl-8 pr-2 py-[3px] text-13-regular transition-colors duration-75 cursor-pointer"
                            style={{ color: "var(--text-muted)", "border-left": "2px solid transparent" }}
                            classList={{ "hover:bg-overlay-hover hover:border-accent-base": true }}
                            onClick={() => props.onProblemClick?.(problem)}
                          >
                            <Icon
                              name={problem.severity === "error" ? "circle-x" : problem.severity === "warning" ? "warning" : "comment"}
                              size="small"
                              classList={{
                                "shrink-0 mt-[3px]": true,
                              }}
                              style={{
                                color: problem.severity === "error" ? "var(--state-danger)" : problem.severity === "warning" ? "var(--state-warning)" : "var(--state-info)",
                              }}
                            />
                            <div class="flex-1 min-w-0">
                              <span class="mr-2" style="color: var(--text-base);">{problem.message}</span>
                              <span class="whitespace-nowrap" style="color: var(--text-weaker);">
                                <Show when={problem.code}>
                                  <span class="mr-2">ts({problem.code})</span>
                                </Show>
                                <span>[Ln {problem.line}, Col {problem.column}]</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </For>
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </Show>
      </div>
    </div>
  )
}

export function OutputTab(props: {
  lines: string[]
}) {
  return (
    <div class="size-full overflow-auto p-3 font-mono text-13-regular" style="color: var(--text-muted);">
      <Show
        when={props.lines.length > 0}
        fallback={
          <div class="flex flex-col items-center justify-center h-full gap-2" style="color: var(--text-weaker);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: var(--icon-weaker); opacity: 0.4;">
              <path d="M4 4H20V20H4V4Z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M4 8H20" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>No output</span>
          </div>
        }
      >
        <For each={props.lines}>
          {(line) => (
            <div class="whitespace-pre-wrap break-all" style="color: var(--text-muted);">{line}</div>
          )}
        </For>
      </Show>
    </div>
  )
}

export function DebugConsoleTab(props: {
  lines: string[]
}) {
  return (
    <div class="size-full flex flex-col">
      <div class="flex items-center px-3 py-1 shrink-0" style={{ background: "var(--background-bg-deep)", "border-bottom": "1px solid var(--border-muted)" }}>
        <input
          type="text"
          class="flex-1 px-2 py-1 text-13-regular rounded-md outline-none"
          style={{
            background: "var(--surface-base)",
            color: "var(--text-base)",
            border: "1px solid var(--border-muted)",
          }}
          placeholder="Type expression to evaluate..."
        />
      </div>
      <div class="flex-1 overflow-auto p-3 font-mono text-13-regular" style="color: var(--text-muted);">
        <For each={props.lines}>
          {(line) => (
            <div class="whitespace-pre-wrap break-all" style="color: var(--text-muted);">{line}</div>
          )}
        </For>
      </div>
    </div>
  )
}
