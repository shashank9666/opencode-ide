import { createStore } from "solid-js/store"
import { createMemo } from "solid-js"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { persisted } from "@/utils/persist"
import { useServerSync } from "./server-sync"
import { useSDK } from "./sdk"

export type LogEntry = {
  id: string
  time: number
  level: "info" | "warn" | "error"
  source: string
  message: string
}

export type AgentLogEntry = LogEntry & {
  agent: string
  action: string
}

export type WorkspaceChange = {
  id: string
  time: number
  type: "session" | "file-edit" | "config" | "tool"
  description: string
  sessionID?: string
}

export type SessionRestorePoint = {
  id: string
  sessionID: string
  time: number
  label: string
}

export type FailedTool = {
  id: string
  sessionID: string
  time: number
  tool: string
  error: string
  retryCount: number
}

export type MetricsSnapshot = {
  totalCost: number
  totalInputTokens: number
  totalOutputTokens: number
  totalReasoningTokens: number
  totalCacheReadTokens: number
  totalCacheWriteTokens: number
  apiCalls: number
  avgResponseTime: number
  lastUpdated: number
}

export type ModelFallbackStatus = {
  primaryModel: string
  fallbackModel: string
  active: boolean
  lastTriggered?: number
  reason?: string
}

export type OfflineQueueItem = {
  id: string
  time: number
  action: string
  payload: unknown
  status: "pending" | "synced" | "failed"
}

export type AutosaveEntry = {
  id: string
  time: number
  sessionID?: string
  type: "session" | "file"
  path?: string
}

export type UndoRedoEntry = {
  id: string
  time: number
  sessionID: string
  type: "edit" | "tool" | "message"
  description: string
  snapshot: unknown
}

const defaultMetrics: MetricsSnapshot = {
  totalCost: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalReasoningTokens: 0,
  totalCacheReadTokens: 0,
  totalCacheWriteTokens: 0,
  apiCalls: 0,
  avgResponseTime: 0,
  lastUpdated: 0,
}

export const { use: useProduction, provider: ProductionProvider } = createSimpleContext({
  name: "Production",
  gate: false,
  init: () => {
    const serverSync = useServerSync()
    const sdk = useSDK()
    const sync = createMemo(() => serverSync().createDirSyncContext(sdk().directory))

    const [metrics, setMetrics] = persisted("production.metrics", createStore<MetricsSnapshot>(defaultMetrics))
    const [logs, setLogs] = createStore<AgentLogEntry[]>([])
    const [workspaceChanges, setWorkspaceChanges] = createStore<WorkspaceChange[]>([])
    const [failedTools, setFailedTools] = createStore<FailedTool[]>([])
    const [restorePoints, setRestorePoints] = createStore<SessionRestorePoint[]>([])
    const [offlineQueue, setOfflineQueue] = createStore<OfflineQueueItem[]>([])
    const [autosaveEntries, setAutosaveEntries] = createStore<AutosaveEntry[]>([])
    const [undoRedo, setUndoRedo] = createStore<UndoRedoEntry[]>([])
    const [modelFallback, setModelFallback] = createStore<ModelFallbackStatus>({
      primaryModel: "",
      fallbackModel: "",
      active: false,
    })

    let logIdCounter = 1
    let changeIdCounter = 1
    let offlineIdCounter = 1
    let autosaveIdCounter = 1
    let undoRedoIdCounter = 1

    const addLog = (entry: Omit<AgentLogEntry, "id">) => {
      const id = `log-${logIdCounter++}`
      const next = { ...entry, id } as AgentLogEntry
      setLogs(logs.length, next)
    }

    const addChange = (change: Omit<WorkspaceChange, "id">) => {
      const id = `change-${changeIdCounter++}`
      const next = { ...change, id } as WorkspaceChange
      setWorkspaceChanges(workspaceChanges.length, next)
    }

    const addFailedTool = (tool: Omit<FailedTool, "id">) => {
      const id = `failed-tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const next = { ...tool, id } as FailedTool
      setFailedTools(failedTools.length, next)
    }

    const addRestorePoint = (point: Omit<SessionRestorePoint, "id">) => {
      const id = `restore-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const next = { ...point, id } as SessionRestorePoint
      setRestorePoints(restorePoints.length, next)
    }

    const conversationSearch = createMemo(() => {
      return (query: string) => {
        const q = query.toLowerCase().trim()
        if (!q) return []
        const results: { sessionID: string; message: string; time: number }[] = []
        const messageMap = sync().data.message
        for (const sessionID of Object.keys(messageMap)) {
          const messages = messageMap[sessionID]
          if (!messages) continue
          for (const msg of messages as any[]) {
            if (msg.role !== "user" && msg.role !== "assistant") continue
            const text = "parts" in msg ? JSON.stringify(msg.parts ?? []) : ""
            if (text.toLowerCase().includes(q)) {
              results.push({ sessionID, message: text.slice(0, 200), time: msg.time.created })
              break
            }
          }
        }
        return results.sort((a, b) => b.time - a.time)
      }
    })

    const recordMetrics = (cost: number, input: number, output: number, reasoning: number, cacheRead: number, cacheWrite: number) => {
      setMetrics("totalCost", metrics.totalCost + cost)
      setMetrics("totalInputTokens", metrics.totalInputTokens + input)
      setMetrics("totalOutputTokens", metrics.totalOutputTokens + output)
      setMetrics("totalReasoningTokens", metrics.totalReasoningTokens + reasoning)
      setMetrics("totalCacheReadTokens", metrics.totalCacheReadTokens + cacheRead)
      setMetrics("totalCacheWriteTokens", metrics.totalCacheWriteTokens + cacheWrite)
      setMetrics("apiCalls", metrics.apiCalls + 1)
      setMetrics("lastUpdated", Date.now())
    }

    const recordResponseTime = (ms: number) => {
      const prev = metrics.apiCalls > 1 ? metrics.avgResponseTime : 0
      const count = metrics.apiCalls
      setMetrics("avgResponseTime", prev + (ms - prev) / count)
    }

    const retryTool = (toolCallId: string) => {
      const tool = failedTools.find((t) => t.id === toolCallId)
      if (!tool) return
      setFailedTools((t) => t.id === toolCallId, "retryCount", tool.retryCount + 1)
    }

    const restoreSession = (restoreId: string) => {
      const point = restorePoints.find((p) => p.id === restoreId)
      if (!point) return
    }

    const addToOfflineQueue = (action: string, payload: unknown) => {
      const id = `offline-${offlineIdCounter++}`
      const item: OfflineQueueItem = { id, time: Date.now(), action, payload, status: "pending" }
      setOfflineQueue(offlineQueue.length, item)
    }

    const syncOfflineItem = (id: string) => {
      setOfflineQueue((item) => item.id === id, "status", "synced")
    }

    const addAutosaveEntry = (entry: Omit<AutosaveEntry, "id">) => {
      const id = `autosave-${autosaveIdCounter++}`
      const next = { ...entry, id } as AutosaveEntry
      setAutosaveEntries(autosaveEntries.length, next)
    }

    const pushUndo = (entry: Omit<UndoRedoEntry, "id">) => {
      const id = `undo-${undoRedoIdCounter++}`
      const next = { ...entry, id } as UndoRedoEntry
      setUndoRedo(undoRedo.length, next)
    }

    const popUndo = (sessionID: string) => {
      for (let i = undoRedo.length - 1; i >= 0; i--) {
        if (undoRedo[i].sessionID === sessionID) {
          const entry = undoRedo[i]
          setUndoRedo((prev) => [...prev.slice(0, i), ...prev.slice(i + 1)])
          return entry
        }
      }
    }

    const setModelFallbackActive = (primary: string, fallback: string, reason?: string) => {
      setModelFallback({
        primaryModel: primary,
        fallbackModel: fallback,
        active: true,
        lastTriggered: Date.now(),
        reason,
      })
    }

    const clearModelFallback = () => {
      setModelFallback("active", false)
    }

    return {
      sync,
      metrics,
      logs,
      workspaceChanges,
      failedTools,
      restorePoints,
      offlineQueue,
      autosaveEntries,
      undoRedo,
      modelFallback,
      addLog,
      addChange,
      addFailedTool,
      addRestorePoint,
      conversationSearch,
      recordMetrics,
      recordResponseTime,
      retryTool,
      restoreSession,
      addToOfflineQueue,
      syncOfflineItem,
      addAutosaveEntry,
      pushUndo,
      popUndo,
      setModelFallbackActive,
      clearModelFallback,
    }
  },
})
