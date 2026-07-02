import { createSignal, createMemo, createEffect, Show, onCleanup } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { BrowserToolbar } from "./browser/BrowserToolbar"
import { BrowserTabBar, type BrowserTab } from "./browser/BrowserTabBar"
import { BrowserEmptyState } from "./browser/BrowserEmptyState"
import { BrowserSkeleton } from "./browser/BrowserSkeleton"
import { BrowserOverlayControls } from "./browser/BrowserOverlayControls"
import { BrowserBottomBar, type BrowserEngine } from "./browser/BrowserBottomBar"
import { BrowserSidebar, type BrowserSession } from "./browser/BrowserSidebar"

// ── Connection status ──
type ConnectionStatus = "idle" | "loading" | "connected" | "error"

// ── History entry ──
type HistoryEntry = {
  url: string
  timestamp: number
  title?: string
}

const RECENT_KEY = "opencode-browser-preview-recent"

function loadRecent(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveRecent(entries: HistoryEntry[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(entries.slice(0, 20)))
}

let consoleIdCounter = 0
let networkIdCounter = 0
let screenshotIdCounter = 0
let logIdCounter = 0

// ── Main Component ──

export function BrowserPreviewPanel() {
  const [tabs, setTabs] = createSignal<BrowserTab[]>([])
  const [activeTabId, setActiveTabId] = createSignal<string | null>(null)
  
  const [history, setHistory] = createSignal<HistoryEntry[]>(loadRecent())
  const [urlStack, setUrlStack] = createSignal<string[]>([])
  const [urlIndex, setUrlIndex] = createSignal(-1)

  const [showSidebar, setShowSidebar] = createSignal(false)
  const [viewportWidth, setViewportWidth] = createSignal(1920)
  const [viewportHeight, setViewportHeight] = createSignal(1080)
  const [engine, setEngine] = createSignal<BrowserEngine>("chromium")

  onCleanup(() => {
    window.dispatchEvent(new CustomEvent("playwright-close-all"))
  })

  // Active Tab helpers
  const activeTab = createMemo(() => tabs().find(t => t.id === activeTabId()) || null)
  const url = createMemo(() => activeTab()?.url || "")
  const status = createMemo<ConnectionStatus>(() => activeTab()?.isLoading ? "loading" : url() ? "connected" : "idle") // Simplified for now

  let loadStartTime = 0
  const [loadTime, setLoadTime] = createSignal<number | null>(null)

  const iframeSrc = createMemo(() => {
    const raw = url().trim()
    if (!raw) return ""
    if (raw.match(/^\d+$/)) return `http://localhost:${raw}`
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) return `http://${raw}`
    return raw
  })

  // Track iframe load status
  const handleIframeLoad = () => {
    const loadMs = Date.now() - loadStartTime
    setLoadTime(loadMs)
    addLog("info", `Page loaded in ${loadMs}ms`)
    
    if (activeTabId()) {
      setTabs(prev => prev.map(t => t.id === activeTabId() ? { ...t, isLoading: false, title: iframeSrc() } : t))
    }
  }

  const handleIframeError = () => {
    setLoadTime(null)
    addLog("error", `Failed to load ${iframeSrc()}`)
    if (activeTabId()) {
      setTabs(prev => prev.map(t => t.id === activeTabId() ? { ...t, isLoading: false } : t))
    }
  }

  // Add to history when URL changes
  createEffect(() => {
    const current = iframeSrc()
    if (!current) return
    loadStartTime = Date.now()
    setLoadTime(null)

    if (activeTabId()) {
      setTabs(prev => prev.map(t => t.id === activeTabId() ? { ...t, isLoading: true } : t))
    }

    const timer = setTimeout(() => {
      setHistory(prev => {
        const entry: HistoryEntry = { url: current, timestamp: Date.now() }
        const filtered = prev.filter(e => e.url !== current)
        const updated = [entry, ...filtered].slice(0, 20)
        saveRecent(updated)
        return updated
      })
    }, 500)
    return () => clearTimeout(timer)
  })

  const navigate = (newUrl: string) => {
    const stack = urlStack()
    const idx = urlIndex()
    const trimmed = stack.slice(0, idx + 1)
    trimmed.push(newUrl)
    setUrlStack(trimmed)
    setUrlIndex(trimmed.length - 1)
    
    if (!activeTabId()) {
      handleNewTab(newUrl)
    } else {
      setTabs(prev => prev.map(t => t.id === activeTabId() ? { ...t, url: newUrl } : t))
    }
    addLog("log", `Navigating to ${newUrl}`)
  }

  const reload = () => {
    const current = url()
    if (!current) return
    setTabs(prev => prev.map(t => t.id === activeTabId() ? { ...t, url: "" } : t))
    setTimeout(() => {
      setTabs(prev => prev.map(t => t.id === activeTabId() ? { ...t, url: current } : t))
    }, 50)
    addLog("log", "Reloading page")
  }

  const goBack = () => {
    const idx = urlIndex()
    if (idx <= 0) return
    const prev = urlStack()[idx - 1]
    setUrlIndex(idx - 1)
    if (activeTabId()) {
      setTabs(prevTabs => prevTabs.map(t => t.id === activeTabId() ? { ...t, url: prev ?? "" } : t))
    }
    addLog("log", `Navigating back to ${prev}`)
  }

  const goForward = () => {
    const stack = urlStack()
    const idx = urlIndex()
    if (idx >= stack.length - 1) return
    const next = stack[idx + 1]
    setUrlIndex(idx + 1)
    if (activeTabId()) {
      setTabs(prevTabs => prevTabs.map(t => t.id === activeTabId() ? { ...t, url: next ?? "" } : t))
    }
    addLog("log", `Navigating forward to ${next}`)
  }

  const canGoBack = () => urlIndex() > 0
  const canGoForward = () => urlIndex() < urlStack().length - 1

  const statusColor = () => {
    switch (status()) {
      case "connected": return "text-[#10b981]"
      case "loading": return "text-[#f59e0b]"
      case "error": return "text-[#ef4444]"
      default: return "text-[#8a8a8a]"
    }
  }

  const statusIcon = () => {
    switch (status()) {
      case "connected": return "circle-check"
      case "loading": return "reset"
      case "error": return "circle-x"
      default: return "browser"
    }
  }

  const addLog = (source: string, message: string) => {
    // Basic log keeping if needed
  }

  // ── Transition animation state ──
  const [transitioning, setTransitioning] = createSignal(false)

  createEffect(() => {
    const current = iframeSrc()
    if (!current) return
    setTransitioning(true)
    const timer = setTimeout(() => setTransitioning(false), 400)
    return () => clearTimeout(timer)
  })

  // ── Action indicator state (for Playwright MCP actions) ──
  const [actionIndicator, setActionIndicator] = createSignal<{ type: string; label: string } | null>(null)
  let actionTimer: ReturnType<typeof setTimeout> | undefined

  const showAction = (type: string, label: string) => {
    if (actionTimer) clearTimeout(actionTimer)
    setActionIndicator({ type, label })
    actionTimer = setTimeout(() => setActionIndicator(null), 2000)
  }

  // Listen for Playwright action events
  createEffect(() => {
    const handlePlaywrightAction = (e: CustomEvent) => {
      const action = e.detail
      if (action?.type === "click") showAction("click", "Click")
      else if (action?.type === "type") showAction("type", `Typing${action.text ? `: ${action.text.slice(0, 30)}${action.text.length > 30 ? "…" : ""}` : "…"}`)
      else if (action?.type === "navigate") showAction("navigate", `Navigating to ${action.url || ""}`)
      else if (action?.type === "screenshot") showAction("screenshot", "Capturing screenshot...")
    }
    window.addEventListener("playwright-action", handlePlaywrightAction as EventListener)
    onCleanup(() => window.removeEventListener("playwright-action", handlePlaywrightAction as EventListener))
  })

  // ── Tab Management ──
  const handleNewTab = (startUrl: string = "") => {
    const newId = `tab-${Date.now()}`
    setTabs(prev => {
      const updated = prev.map(t => ({ ...t, isActive: false }))
      return [...updated, { id: newId, url: startUrl, title: "New Tab", isActive: true, isLoading: !!startUrl }]
    })
    setActiveTabId(newId)
  }

  const handleSelectTab = (id: string) => {
    setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === id })))
    setActiveTabId(id)
  }

  const handleCloseTab = (id: string) => {
    setTabs(prev => {
      const updated = prev.filter(t => t.id !== id)
      if (activeTabId() === id) {
        const nextActive = updated[updated.length - 1]?.id || null
        setActiveTabId(nextActive)
        return updated.map(t => ({ ...t, isActive: t.id === nextActive }))
      }
      return updated
    })
  }

  const sessions = createMemo<BrowserSession[]>(() => 
    tabs().map(t => ({
      id: t.id,
      title: t.title,
      url: t.url,
      status: t.isLoading ? "loading" : t.url ? "connected" : "idle",
      createdAt: Date.now() // placeholder
    }))
  )

  return (
    <div class="flex flex-col w-full h-full min-h-0 min-w-0 bg-[#1e1e1e] overflow-hidden">
      {/* Browser Chrome: Tab Bar */}
      <BrowserTabBar
        tabs={tabs()}
        onSelect={handleSelectTab}
        onClose={handleCloseTab}
        onNewTab={() => handleNewTab("")}
      />

      <div class="flex flex-1 min-h-0 overflow-hidden">
        {/* Browser Sidebar */}
        <Show when={showSidebar()}>
          <BrowserSidebar
            sessions={sessions()}
            activeSessionId={activeTabId()}
            onSelectSession={handleSelectTab}
            onNewSession={() => handleNewTab("")}
            onCloseSession={handleCloseTab}
            onCloseSidebar={() => setShowSidebar(false)}
          />
        </Show>

        <div class="flex flex-col flex-1 min-w-0 relative bg-white">
          {/* Main Browser Area */}
          <Show 
            when={url()} 
            fallback={
              <BrowserEmptyState 
                onNavigate={navigate}
                recentUrls={history().map(h => h.url)}
              />
            }
          >
            {/* Floating Toolbar */}
            <BrowserToolbar
              url={url()}
              onUrlChange={(val) => {
                if (activeTabId()) {
                  setTabs(prev => prev.map(t => t.id === activeTabId() ? { ...t, url: val } : t))
                }
              }}
              onNavigate={() => navigate(url())}
              onBack={goBack}
              onForward={goForward}
              onReload={reload}
              onClear={() => {
                if (activeTabId()) {
                  setTabs(prev => prev.map(t => t.id === activeTabId() ? { ...t, url: "" } : t))
                }
              }}
              canGoBack={canGoBack()}
              canGoForward={canGoForward()}
              statusIcon={statusIcon()}
              statusColor={statusColor()}
            />

            {/* Overlay Controls */}
            <BrowserOverlayControls
              status={status() as any}
              latency={loadTime()}
              viewportWidth={viewportWidth()}
              viewportHeight={viewportHeight()}
              onRefresh={reload}
              onOpenExternal={() => {
                const current = iframeSrc()
                if (current) window.open(current, "_blank")
              }}
            />

            {/* Viewport Container (Centered) */}
            <div class="flex-1 w-full h-full bg-transparent overflow-auto flex items-center justify-center">
              <div 
                class="relative bg-transparent transition-all duration-300 flex-shrink-0"
                style={{ 
                  width: viewportWidth() === 1920 ? '100%' : `${viewportWidth()}px`, 
                  height: viewportHeight() === 1080 ? '100%' : `${viewportHeight()}px`,
                  "max-width": "100%",
                  "max-height": "100%"
                }}
              >
                {/* Loading Skeleton */}
                <Show when={status() === "loading"}>
                  <BrowserSkeleton />
                </Show>
                
                {/* Page transition animation */}
                <div class={`absolute inset-0 transition-opacity duration-300 ${transitioning() ? "opacity-0" : "opacity-100"}`}>
                  <iframe
                    src={iframeSrc()}
                    class="w-full h-full border-none bg-transparent"
                    title="Browser Preview"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
                  />
                </div>
                
                {/* Action indicator overlay */}
                <Show when={actionIndicator()}>
                  {(indicator) => (
                    <div class="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-surface-raised-base border border-border-base rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                      <Show when={indicator().type === "click"}>
                        <div class="size-3 rounded-full bg-success-base animate-ping" />
                      </Show>
                      <Show when={indicator().type === "type"}>
                        <div class="flex gap-0.5">
                          <div class="size-1.5 bg-accent-base rounded-full animate-bounce [animation-delay:0ms]" />
                          <div class="size-1.5 bg-accent-base rounded-full animate-bounce [animation-delay:150ms]" />
                          <div class="size-1.5 bg-accent-base rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </Show>
                      <Show when={indicator().type === "navigate"}>
                        <Icon name="reset" size="small" class="text-icon-weak animate-spin" />
                      </Show>
                      <span class="text-12-regular text-text-strong">{indicator().label}</span>
                    </div>
                  )}
                </Show>
              </div>
            </div>

          </Show>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <BrowserBottomBar
        url={iframeSrc()}
        status={status() as any}
        latency={loadTime()}
        viewportWidth={viewportWidth()}
        viewportHeight={viewportHeight()}
        onViewportChange={(w, h) => { setViewportWidth(w); setViewportHeight(h) }}
      />
    </div>
  )
}
