import { For, Show, createSignal, createEffect, onCleanup } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { Tooltip } from "@opencode-ai/ui/tooltip"

export type ActivityBarTab = "explorer" | "search" | "source-control" | "run-debug" | "ai-chat" | "database" | "remote" | "testing"
export type BottomPanelTab = "terminal" | "problems" | "output" | "debug-console"

const SIDEBAR_TABS = [
  { tab: "explorer" as const, icon: "file-tree" as const, activeIcon: "file-tree-active" as const, label: "Explorer", shortcut: "Ctrl+Shift+E" },
  { tab: "search" as const, icon: "magnifying-glass" as const, label: "Search", shortcut: "Ctrl+Shift+F" },
  { tab: "source-control" as const, icon: "branch" as const, label: "Source Control", shortcut: "Ctrl+Shift+G" },
  { tab: "run-debug" as const, icon: "window-cursor" as const, label: "Run & Debug", shortcut: "Ctrl+Shift+D" },
  { tab: "ai-chat" as const, icon: "brain" as const, label: "AI Assistant", shortcut: "Ctrl+Shift+I" },
  { tab: "remote" as const, icon: "arrow-right" as const, label: "Remote Explorer", shortcut: "" },
  { tab: "testing" as const, icon: "check" as const, label: "Testing", shortcut: "" },
]

export default function ActivityBar(props: {
  activeTab: ActivityBarTab
  activeRightTab?: string
  sidebarOpen: boolean
  rightPanelOpen?: boolean
  bottomPanelOpen: boolean
  bottomTab: BottomPanelTab
  onTabClick: (tab: ActivityBarTab) => void
  onBottomTabClick: (tab: BottomPanelTab) => void
  onOpenFolder: () => void
  onRemoteClick: () => void
  remoteConnection?: string
}) {
  const [contextMenuPos, setContextMenuPos] = createSignal<{ x: number; y: number } | null>(null)
  const [hoveredTab, setHoveredTab] = createSignal<string | null>(null)
  const [localActive, setLocalActive] = createSignal<string | null>(null)

  const active = (tab: ActivityBarTab) => {
    if (tab === "ai-chat") return props.activeRightTab === "ai-chat" && props.rightPanelOpen
    return props.activeTab === tab && props.sidebarOpen
  }
  const activeBottom = (tab: BottomPanelTab) => props.bottomPanelOpen && props.bottomTab === tab

  createEffect(() => {
    if (props.sidebarOpen) setLocalActive(props.activeTab)
  })

  const [mounted, setMounted] = createSignal(false)
  createEffect(() => { setMounted(true); onCleanup(() => setMounted(false)) })

  return (
    <>
      {contextMenuPos() && (
        <>
          <div class="fixed inset-0 z-40" onClick={() => setContextMenuPos(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenuPos(null); }} />
          <div
            class="fixed z-50 min-w-48 py-1 rounded-xl border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: `${contextMenuPos()!.x}px`,
              top: `${contextMenuPos()!.y}px`,
              "background": "var(--surface-raised-base)",
              "border-color": "var(--border-base)",
            }}
          >
            <div class="px-3 py-1.5 text-11-medium text-text-weaker uppercase tracking-wider">View</div>
            <For each={SIDEBAR_TABS}>
              {(item) => (
                <button
                  class="w-full flex items-center gap-2.5 px-3 py-1.5 text-13-regular hover:bg-accent-base hover:text-white transition-colors"
                  onClick={() => { props.onTabClick(item.tab); setContextMenuPos(null) }}
                >
                  <span class="size-4 flex items-center justify-center">
                    <Show when={active(item.tab)}>
                      <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
                    </Show>
                  </span>
                  {item.label}
                </button>
              )}
            </For>
          </div>
        </>
      )}

      <div
        class="activity-bar w-12 shrink-0 flex flex-col items-center py-0 border-r select-none [app-region:no-drag] size-full relative"
        style={{
          "background": "var(--background-bg-deep)",
          "border-color": "var(--border-muted)",
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          setContextMenuPos({ x: e.clientX, y: e.clientY })
        }}
      >
        {/* Top section - sidebar panels */}
        <div class="flex flex-col items-center w-full pt-1 gap-0.5">
          <For each={SIDEBAR_TABS}>
            {(item) => {
              const isActive = () => active(item.tab)
              const isHovered = () => hoveredTab() === item.tab && !isActive()
              return (
                <Tooltip
                  value={
                    <div class="flex flex-col gap-0.5">
                      <span class="text-13-medium text-text-strong">{item.label}</span>
                      <Show when={item.shortcut}>
                        <span class="text-11-regular text-text-weaker">{item.shortcut}</span>
                      </Show>
                    </div>
                  }
                  placement="right"
                >
                  <button
                    type="button"
                    class="w-full h-10 flex items-center justify-center relative group transition-all duration-150"
                    classList={{
                      "text-icon-base": isActive(),
                      "text-icon-weaker hover:text-icon-muted": !isActive(),
                    }}
                    onClick={() => props.onTabClick(item.tab)}
                    onMouseEnter={() => setHoveredTab(item.tab)}
                    onMouseLeave={() => setHoveredTab(null)}
                    aria-label={item.label}
                  >
                    {/* Active indicator - animated bar */}
                    <div
                      class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200 ease-out"
                      classList={{
                        "bg-accent-base opacity-100 scale-y-100": isActive(),
                        "opacity-0 scale-y-0": !isActive(),
                      }}
                      style={{ height: isActive() ? "20px" : "0px" }}
                    />

                    {/* Active background glow */}
                    <div
                      class="absolute inset-0 mx-1.5 rounded-lg transition-all duration-150"
                      classList={{
                        "bg-accent-base/8": isActive(),
                        "bg-overlay-hover group-hover:opacity-100 opacity-0": !isActive(),
                      }}
                    />

                    {/* Icon with subtle scale on hover */}
                    <div
                      class="relative z-10 transition-transform duration-150"
                      classList={{
                        "scale-100": !isHovered() && !isActive(),
                        "scale-110": isHovered() || isActive(),
                      }}
                    >
                      <Icon
                        name={item.activeIcon && isActive() ? item.activeIcon : item.icon}
                        size="large"
                      />
                    </div>
                  </button>
                </Tooltip>
              )
            }}
          </For>
        </div>

        {/* Spacer */}
        <div class="flex-1" />

        {/* Bottom section - panel toggles */}
        <div class="flex flex-col items-center w-full gap-0.5 pb-1">
          {/* Subtle divider */}
          <div class="w-6 h-px rounded-full mb-1" style={{ "background": "var(--border-muted)" }} />

          <Tooltip value={
            <div class="flex flex-col gap-0.5">
              <span class="text-13-medium text-text-strong">Terminal</span>
              <span class="text-11-regular text-text-weaker">Ctrl+`</span>
            </div>
          } placement="right">
            <button
              type="button"
              class="w-full h-10 flex items-center justify-center relative group transition-all duration-150"
              classList={{
                "text-icon-base": activeBottom("terminal"),
                "text-icon-weaker hover:text-icon-muted": !activeBottom("terminal"),
              }}
              onClick={() => props.onBottomTabClick("terminal")}
              aria-label="Terminal"
            >
              <div
                class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200 ease-out"
                classList={{
                  "bg-accent-base opacity-100 scale-y-100": activeBottom("terminal"),
                  "opacity-0 scale-y-0": !activeBottom("terminal"),
                }}
                style={{ height: activeBottom("terminal") ? "20px" : "0px" }}
              />
              <div
                class="absolute inset-0 mx-1.5 rounded-lg transition-all duration-150"
                classList={{
                  "bg-accent-base/8": activeBottom("terminal"),
                  "bg-overlay-hover group-hover:opacity-100 opacity-0": !activeBottom("terminal"),
                }}
              />
              <div class="relative z-10 transition-transform duration-150 group-hover:scale-110">
                <Icon name={activeBottom("terminal") ? "terminal-active" : "terminal"} size="large" />
              </div>
            </button>
          </Tooltip>

          <Tooltip value={
            <div class="flex flex-col gap-0.5">
              <span class="text-13-medium text-text-strong">Problems</span>
              <span class="text-11-regular text-text-weaker">Ctrl+Shift+M</span>
            </div>
          } placement="right">
            <button
              type="button"
              class="w-full h-10 flex items-center justify-center relative group transition-all duration-150"
              classList={{
                "text-icon-base": activeBottom("problems"),
                "text-icon-weaker hover:text-icon-muted": !activeBottom("problems"),
              }}
              onClick={() => props.onBottomTabClick("problems")}
              aria-label="Problems"
            >
              <div
                class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200 ease-out"
                classList={{
                  "bg-accent-base opacity-100 scale-y-100": activeBottom("problems"),
                  "opacity-0 scale-y-0": !activeBottom("problems"),
                }}
                style={{ height: activeBottom("problems") ? "20px" : "0px" }}
              />
              <div
                class="absolute inset-0 mx-1.5 rounded-lg transition-all duration-150"
                classList={{
                  "bg-accent-base/8": activeBottom("problems"),
                  "bg-overlay-hover group-hover:opacity-100 opacity-0": !activeBottom("problems"),
                }}
              />
              <div class="relative z-10 transition-transform duration-150 group-hover:scale-110">
                <Icon name="circle-x" size="large" />
              </div>
            </button>
          </Tooltip>

          <Tooltip value={
            <div class="flex flex-col gap-0.5">
              <span class="text-13-medium text-text-strong">Output</span>
              <span class="text-11-regular text-text-weaker">Ctrl+Shift+U</span>
            </div>
          } placement="right">
            <button
              type="button"
              class="w-full h-10 flex items-center justify-center relative group transition-all duration-150"
              classList={{
                "text-icon-base": activeBottom("output"),
                "text-icon-weaker hover:text-icon-muted": !activeBottom("output"),
              }}
              onClick={() => props.onBottomTabClick("output")}
              aria-label="Output"
            >
              <div
                class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200 ease-out"
                classList={{
                  "bg-accent-base opacity-100 scale-y-100": activeBottom("output"),
                  "opacity-0 scale-y-0": !activeBottom("output"),
                }}
                style={{ height: activeBottom("output") ? "20px" : "0px" }}
              />
              <div
                class="absolute inset-0 mx-1.5 rounded-lg transition-all duration-150"
                classList={{
                  "bg-accent-base/8": activeBottom("output"),
                  "bg-overlay-hover group-hover:opacity-100 opacity-0": !activeBottom("output"),
                }}
              />
              <div class="relative z-10 transition-transform duration-150 group-hover:scale-110">
                <Icon name="console" size="large" />
              </div>
            </button>
          </Tooltip>

          <Tooltip value={
            <div class="flex flex-col gap-0.5">
              <span class="text-13-medium text-text-strong">Debug Console</span>
              <span class="text-11-regular text-text-weaker">Ctrl+Shift+Y</span>
            </div>
          } placement="right">
            <button
              type="button"
              class="w-full h-10 flex items-center justify-center relative group transition-all duration-150"
              classList={{
                "text-icon-base": activeBottom("debug-console"),
                "text-icon-weaker hover:text-icon-muted": !activeBottom("debug-console"),
              }}
              onClick={() => props.onBottomTabClick("debug-console")}
              aria-label="Debug Console"
            >
              <div
                class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200 ease-out"
                classList={{
                  "bg-accent-base opacity-100 scale-y-100": activeBottom("debug-console"),
                  "opacity-0 scale-y-0": !activeBottom("debug-console"),
                }}
                style={{ height: activeBottom("debug-console") ? "20px" : "0px" }}
              />
              <div
                class="absolute inset-0 mx-1.5 rounded-lg transition-all duration-150"
                classList={{
                  "bg-accent-base/8": activeBottom("debug-console"),
                  "bg-overlay-hover group-hover:opacity-100 opacity-0": !activeBottom("debug-console"),
                }}
              />
              <div class="relative z-10 transition-transform duration-150 group-hover:scale-110">
                <Icon name="window-cursor" size="large" />
              </div>
            </button>
          </Tooltip>

          {/* Remote Connection Button - always visible at bottom */}
          <div class="w-8 h-px rounded-full my-0.5" style={{ "background": "var(--border-muted)" }} />

          <Tooltip value={
            <div class="flex flex-col gap-0.5">
              <span class="text-13-medium text-text-strong">Remote Connection</span>
              <Show when={props.remoteConnection}>
                <span class="text-11-regular text-text-weaker">{props.remoteConnection}</span>
              </Show>
            </div>
          } placement="right">
            <button
              type="button"
              class="w-full h-9 flex items-center justify-center relative group transition-all duration-150"
              classList={{
                "text-white": !!props.remoteConnection,
                "text-icon-weaker hover:text-icon-muted": !props.remoteConnection,
              }}
              onClick={() => props.onRemoteClick()}
              aria-label="Remote Window"
            >
              <div
                class="absolute inset-0 mx-1.5 rounded-lg transition-all duration-150"
                classList={{
                  "bg-accent-base/15": !!props.remoteConnection,
                  "bg-overlay-hover group-hover:opacity-100 opacity-0": !props.remoteConnection,
                }}
              />
              <div class="relative z-10 transition-transform duration-150 group-hover:scale-110">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" class="size-5">
                  <path d="M5 4L1.5 7.5L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M11 4L14.5 7.5L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </button>
          </Tooltip>
        </div>
      </div>
    </>
  )
}
