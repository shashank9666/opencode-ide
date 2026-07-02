import { Show, createSignal } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { IdeContextUsage } from "@/components/ide-context-usage"

export default function ModernStatusBar(props: {
  line: number
  column: number
  language: string
  encoding: string
  lineEnding: string
  dirty: boolean
  gitBranch?: string
  gitChanges?: number
  providerName?: string
  modelName?: string
  terminalCount?: number
  problemsCount?: number
  warningsCount?: number
  syncStatus?: "synced" | "syncing" | "error"
  remoteConnection?: string
  activeSessionId?: string | null
  hasSplit?: boolean
  fullScreen?: boolean
  onLanguageClick?: () => void
  onGitClick?: () => void
  onProblemsClick?: () => void
  onCommandPalette?: () => void
  onRemoteClick?: () => void
  onSplitHorizontal?: () => void
  onSplitVertical?: () => void
  onMergeAll?: () => void
  onToggleFullScreen?: () => void
}) {
  const [expanded, setExpanded] = createSignal(false)

  return (
    <div
      class="flex items-center justify-between shrink-0 select-none text-12-regular"
      style={{
        height: "24px",
        background: "var(--background-bg-deep)",
        color: "var(--text-muted)",
        "border-top": "1px solid var(--border-muted)",
      }}
    >
      {/* Left section */}
      <div class="flex items-center h-full">
        {/* Remote indicator - compact */}
        <Show when={props.remoteConnection}>
          <button
            type="button"
            class="flex items-center gap-1 px-2 h-full transition-colors duration-75"
            style={{ color: "var(--accent-base)" }}
            onClick={props.onRemoteClick}
            title={`Connected to ${props.remoteConnection}`}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="size-3">
              <path d="M5 4L1.5 7.5L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M11 4L14.5 7.5L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="text-11-medium truncate max-w-24">{props.remoteConnection}</span>
          </button>
          <div class="w-px h-3" style={{ background: "var(--border-muted)" }} />
        </Show>

        {/* Git branch */}
        <Show when={props.gitBranch}>
          <Tooltip value={`Git: ${props.gitBranch}${props.gitChanges ? ` (${props.gitChanges} changes)` : ""}`} placement="top">
            <button
              type="button"
              class="flex items-center gap-1 px-2 h-full transition-colors duration-75 hover:bg-overlay-hover"
              onClick={props.onGitClick}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="size-3" style="color: var(--icon-muted);">
                <path d="M2 4C2 2.89543 2.89543 2 4 2H12C13.1046 2 14 2.89543 14 4V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12V4Z" stroke="currentColor" stroke-width="1.3"/>
                <path d="M5.5 8L7.5 10L11 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="truncate max-w-24 text-11-medium" style={{ color: "var(--text-base)" }}>{props.gitBranch}</span>
              <Show when={props.gitChanges && props.gitChanges > 0}>
                <span class="text-11-medium ml-0.5" style={{ color: "var(--text-muted)" }}>{props.gitChanges}</span>
              </Show>
            </button>
          </Tooltip>
          <div class="w-px h-3" style={{ background: "var(--border-muted)" }} />
        </Show>

        {/* Problems & Warnings */}
        <button
          type="button"
          class="flex items-center gap-1.5 px-2 h-full transition-colors duration-75 hover:bg-overlay-hover"
          onClick={props.onProblemsClick}
        >
          <Show when={(props.problemsCount ?? 0) > 0}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="size-3" style="color: var(--state-danger);">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.3"/>
              <path d="M8 5V9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              <circle cx="8" cy="11" r="0.8" fill="currentColor"/>
            </svg>
            <span>{props.problemsCount}</span>
          </Show>
          <Show when={(props.warningsCount ?? 0) > 0}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="size-3" style="color: var(--state-warning);">
              <path d="M8 2.5L2 13.5H14L8 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
              <path d="M8 6.5V9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              <circle cx="8" cy="11.5" r="0.8" fill="currentColor"/>
            </svg>
            <span>{props.warningsCount}</span>
          </Show>
        </button>

        {/* Dirty indicator */}
        <Show when={props.dirty}>
          <div class="flex items-center gap-1 px-2" style="color: var(--state-warning);">
            <div class="size-1.5 rounded-full" style="background: var(--state-warning);" />
            <span class="text-11-regular">unsaved</span>
          </div>
        </Show>

        {/* Sync status */}
        <Show when={props.syncStatus}>
          <Tooltip value={`Sync: ${props.syncStatus}`} placement="top">
            <div class="flex items-center gap-1 px-2">
              <div
                class="size-1.5 rounded-full"
                classList={{
                  "bg-icon-diff-add-base": props.syncStatus === "synced",
                  "bg-accent-base animate-pulse": props.syncStatus === "syncing",
                  "bg-text-danger-base": props.syncStatus === "error",
                }}
              />
            </div>
          </Tooltip>
        </Show>
      </div>

      {/* Right section */}
      <div class="flex items-center h-full">

        {/* Context Usage */}
        <IdeContextUsage activeSessionId={props.activeSessionId ?? null} />

        {/* Terminal count */}
        <Show when={props.terminalCount && props.terminalCount > 0}>
          <button
            type="button"
            class="flex items-center gap-1 px-2 h-full transition-colors duration-75 hover:bg-overlay-hover"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="size-3" style="color: var(--icon-muted);">
              <path d="M2 4L6 8L2 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 12H14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <span>{props.terminalCount}</span>
          </button>
          <div class="w-px h-3" style={{ background: "var(--border-muted)" }} />
        </Show>

        {/* Encoding */}
        <Tooltip value={`Encoding: ${props.encoding}`} placement="top">
          <button
            type="button"
            class="px-2 h-full transition-colors duration-75 hover:bg-overlay-hover text-11-regular"
          >
            {props.encoding}
          </button>
        </Tooltip>

        {/* Line ending */}
        <Tooltip value={`Line Ending: ${props.lineEnding}`} placement="top">
          <button
            type="button"
            class="px-2 h-full transition-colors duration-75 hover:bg-overlay-hover text-11-regular"
          >
            {props.lineEnding}
          </button>
        </Tooltip>

        {/* Line/Column */}
        <button
          type="button"
          class="flex items-center gap-1 px-2 h-full transition-colors duration-75 hover:bg-overlay-hover"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="size-3" style="color: var(--icon-muted);">
            <path d="M4 2V14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M8 4V12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M12 6V10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <span class="text-11-medium" style="color: var(--text-base);">Ln {props.line}, Col {props.column}</span>
        </button>

        <div class="w-px h-3" style={{ background: "var(--border-muted)" }} />

        {/* Language */}
        <Tooltip value="Select Language Mode" placement="top">
          <button
            type="button"
            class="px-2 h-full transition-colors duration-75 hover:bg-overlay-hover text-11-medium"
            style={{ color: "var(--text-base)" }}
            onClick={props.onLanguageClick}
          >
            {props.language}
          </button>
        </Tooltip>

        <div class="w-px h-3" style={{ background: "var(--border-muted)" }} />

        {/* Split controls */}
        <Show when={props.hasSplit}>
          <Tooltip value="Merge All Panels" placement="top">
            <button
              type="button"
              class="px-1.5 h-full transition-colors duration-75 hover:bg-overlay-hover"
              onClick={props.onMergeAll}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="size-3" style="color: var(--icon-muted);">
                <path d="M2 4H14V12H2V4Z" stroke="currentColor" stroke-width="1.3"/>
                <path d="M8 4V12" stroke="currentColor" stroke-width="1.3"/>
              </svg>
            </button>
          </Tooltip>
        </Show>
        <Tooltip value="Split Editor Right" placement="top">
          <button
            type="button"
            class="px-1.5 h-full transition-colors duration-75 hover:bg-overlay-hover"
            onClick={props.onSplitHorizontal}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="size-3" style="color: var(--icon-muted);">
              <path d="M3 2.5H13C13.8284 2.5 14.5 3.17157 14.5 4V12C14.5 12.8284 13.8284 13.5 13 13.5H3C2.17157 13.5 1.5 12.8284 1.5 12V4C1.5 3.17157 2.17157 2.5 3 2.5Z" stroke="currentColor" stroke-width="1.3"/>
              <path d="M8.5 2.5V13.5" stroke="currentColor" stroke-width="1.3"/>
            </svg>
          </button>
        </Tooltip>
        <Tooltip value="Split Editor Down" placement="top">
          <button
            type="button"
            class="px-1.5 h-full transition-colors duration-75 hover:bg-overlay-hover"
            onClick={props.onSplitVertical}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="size-3" style="color: var(--icon-muted);">
              <path d="M3 2.5H13C13.8284 2.5 14.5 3.17157 14.5 4V12C14.5 12.8284 13.8284 13.5 13 13.5H3C2.17157 13.5 1.5 12.8284 1.5 12V4C1.5 3.17157 2.17157 2.5 3 2.5Z" stroke="currentColor" stroke-width="1.3"/>
              <path d="M1.5 8.5H14.5" stroke="currentColor" stroke-width="1.3"/>
            </svg>
          </button>
        </Tooltip>

        {/* Full Screen */}
        <Tooltip value={props.fullScreen ? "Exit Full Screen" : "Full Screen"} placement="top">
          <button
            type="button"
            class="px-1.5 h-full transition-colors duration-75 hover:bg-overlay-hover"
            onClick={props.onToggleFullScreen}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="size-3" style="color: var(--icon-muted);">
              <Show when={!props.fullScreen}>
                <path d="M2 6V2H6M14 10V14H10M2 10V14H6M14 6V2H10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </Show>
              <Show when={props.fullScreen}>
                <path d="M6 10V14H2M10 6V2H14M10 14V10H14M6 2V6H2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </Show>
            </svg>
          </button>
        </Tooltip>

        {/* Command Palette button */}
        <Tooltip value="Command Palette (Ctrl+Shift+P)" placement="top">
          <button
            type="button"
            class="px-1.5 h-full transition-colors duration-75 hover:bg-overlay-hover"
            onClick={props.onCommandPalette}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="size-3" style="color: var(--icon-muted);">
              <path d="M4 4L8 8L4 12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 12H14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
