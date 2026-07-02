import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import FileTree from "@/components/file-tree"
import { useFile } from "@/context/file"
import { createSignal, createEffect, Show } from "solid-js"

export interface ExplorerPanelProps {
  dirName: string
  activeFile: string | undefined
  onCreateFile: () => void
  onCreateFolder: () => void
  onFileClick: (node: { path: string; type: string }) => void
  onFileContextMenu?: (e: MouseEvent, node: { path: string; type: string }) => void
  kinds?: Map<string, "add" | "del" | "mix">
  marks?: Set<string>
  openFiles?: string[]
}

const RECENT_FILES_KEY = "opencode-explorer-recent"
function loadRecentFiles(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_FILES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}
function saveRecentFiles(files: string[]) {
  localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(files.slice(0, 10)))
}

export default function ExplorerPanel(props: ExplorerPanelProps) {
  const file = useFile()
  const [recentFiles, setRecentFiles] = createSignal<string[]>(loadRecentFiles())
  const [showRecent, setShowRecent] = createSignal(true)
  const [sortMode, setSortMode] = createSignal<"name" | "type" | "modified">("name")

  createEffect(() => {
    const active = props.activeFile
    if (!active) return
    setRecentFiles(prev => {
      const next = [active, ...prev.filter(f => f !== active)].slice(0, 10)
      saveRecentFiles(next)
      return next
    })
  })

  const removeRecentFile = (path: string) => {
    setRecentFiles((prev) => {
      const next = prev.filter((item) => item !== path)
      saveRecentFiles(next)
      return next
    })
  }

  const getFilename = (path: string) => path.split("/").pop() ?? path
  const getFileIcon = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase() ?? ""
    const iconMap: Record<string, string> = {
      ts: "code", tsx: "code", js: "code", jsx: "code",
      json: "bullet-list", md: "comment", css: "code",
      html: "globe", py: "code", go: "code", rs: "code",
      svg: "image", png: "image", jpg: "image", gif: "image",
      gitignore: "branch", yaml: "bullet-list", yml: "bullet-list",
    }
    return iconMap[ext] ?? "open-file"
  }

  return (
    <div class="size-full flex flex-col" style={{ background: "var(--background-bg-base)" }}>
      {/* Header */}
      <div class="flex items-center justify-between px-3 py-[7px] shrink-0 group/header" style={{ "border-bottom": "1px solid var(--border-muted)" }}>
        <span class="text-11-medium uppercase tracking-wider" style={{ color: "var(--text-weaker)" }}>Explorer</span>
        <div class="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity duration-100">
          <IconButton icon="plus" variant="ghost" size="small" class="size-5 text-icon-weaker hover:text-icon-muted" onClick={() => props.onCreateFile()} aria-label="New File" />
          <IconButton icon="folder" variant="ghost" size="small" class="size-5 text-icon-weaker hover:text-icon-muted" onClick={() => props.onCreateFolder()} aria-label="New Folder" />
        </div>
      </div>

      <div class="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Recently Opened Files */}
        <Show when={recentFiles().length > 0}>
          <div>
            <button
              type="button"
              class="w-full flex items-center gap-1 px-2 py-[5px] text-11-medium uppercase tracking-wider transition-colors duration-75"
              style={{ color: "var(--text-weaker)" }}
              classList={{ "hover:bg-overlay-hover": true }}
              onClick={() => setShowRecent(!showRecent())}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" class="shrink-0" style="color: var(--icon-weaker);">
                <path d={showRecent() ? "M2 3.5L5 6.5L8 3.5" : "M3.5 2L6.5 5L3.5 8"} stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Recent</span>
              <span class="ml-auto text-10-regular" style="color: var(--text-weaker); opacity: 0.6;">{recentFiles().length}</span>
            </button>
            <Show when={showRecent()}>
              <div class="max-h-48 overflow-y-auto">
                {recentFiles().map((filePath) => (
                  <button
                    type="button"
                    class="w-full flex items-center gap-2 px-3 py-[3px] text-12-regular transition-colors duration-75 group"
                    style={{ color: "var(--text-muted)" }}
                    classList={{ "hover:bg-overlay-hover hover:text-text-base": true }}
                    onClick={() => {
                      const node = { path: filePath, type: "file" }
                      props.onFileClick(node)
                    }}
                  >
                    <Icon name={getFileIcon(filePath) as any} size="small" class="shrink-0" style="color: var(--icon-weaker);" />
                    <span class="truncate flex-1 text-left">{getFilename(filePath)}</span>
                    <span class="text-10-regular truncate max-w-20 shrink-0 text-right" style="color: var(--text-weaker); opacity: 0.5;">
                      {filePath.split("/").slice(-2, -1).join("")}
                    </span>
                    <IconButton
                      icon="close"
                      variant="ghost"
                      size="small"
                      class="size-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-75"
                      style="color: var(--icon-weaker);"
                      aria-label={`Remove ${getFilename(filePath)} from recent files`}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        removeRecentFile(filePath)
                      }}
                    />
                  </button>
                ))}
              </div>
            </Show>
          </div>
        </Show>

        {/* Workspace Root Section */}
        <div class="sticky top-0 z-10 flex items-center justify-between px-1 py-[3px] group/root" style={{ background: "var(--background-bg-base)", "border-bottom": "1px solid var(--border-muted)" }}>
          <div class="flex items-center gap-1 min-w-0 px-2" onClick={() => file.tree.refresh("")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="color: var(--icon-weaker);">
              <path d="M2 4C2 2.89543 2.89543 2 4 2H7L9 4H12C13.1046 4 14 4.89543 14 6V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12V4Z" stroke="currentColor" stroke-width="1.3"/>
            </svg>
            <span class="text-11-medium truncate" style="color: var(--text-base);">{props.dirName}</span>
          </div>
          <div class="flex items-center gap-0.5 opacity-0 group-hover/root:opacity-100 transition-opacity duration-100">
            <IconButton icon="plus" variant="ghost" size="small" class="size-5 text-icon-weaker hover:text-icon-muted" onClick={(e) => { e.stopPropagation(); props.onCreateFile() }} aria-label="New File" />
            <IconButton icon="folder" variant="ghost" size="small" class="size-5 text-icon-weaker hover:text-icon-muted" onClick={(e) => { e.stopPropagation(); props.onCreateFolder() }} aria-label="New Folder" />
            <IconButton icon="reset" variant="ghost" size="small" class="size-5 text-icon-weaker hover:text-icon-muted" onClick={(e) => { e.stopPropagation(); file.tree.refreshAll() }} aria-label="Refresh Explorer" />
            <IconButton icon="collapse" variant="ghost" size="small" class="size-5 text-icon-weaker hover:text-icon-muted" onClick={(e) => { e.stopPropagation(); file.tree.collapseAll() }} aria-label="Collapse All" />
          </div>
        </div>

        {/* Sort controls */}
        <div class="flex items-center gap-1 px-2 py-[3px] shrink-0" style={{ "border-bottom": "1px solid var(--border-muted)", opacity: 0.6 }}>
          <span class="text-10-regular" style={{ color: "var(--text-weaker)" }}>Sort:</span>
          {(["name", "type", "modified"] as const).map((mode) => (
            <button
              type="button"
              class="text-10-medium px-1.5 py-[1px] rounded transition-colors duration-75"
              classList={{
                "text-accent-base": sortMode() === mode,
              }}
              style={sortMode() === mode ? { background: "var(--accent-base)", color: "white" } : { color: "var(--text-weaker)" }}
              onClick={() => setSortMode(mode)}
            >
              {mode === "name" ? "Name" : mode === "type" ? "Type" : "Modified"}
            </button>
          ))}
        </div>

        {/* File tree */}
        <div class="flex-1 overflow-y-auto min-h-0 relative">
          <FileTree
            path=""
            sortMode={sortMode()}
            active={props.activeFile}
            onFileClick={props.onFileClick}
            onContextMenu={props.onFileContextMenu}
            kinds={props.kinds}
            _marks={props.marks}
          />
        </div>
      </div>
    </div>
  )
}
