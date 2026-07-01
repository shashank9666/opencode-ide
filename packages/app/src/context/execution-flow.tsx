import { createContext, useContext, type ParentProps } from "solid-js"
import { createMemo } from "solid-js"
import { useSync } from "./sync"
import { useSessionLayout } from "@/pages/session/session-layout"
import type {
  AssistantMessage,
  Message,
  Part,
  ToolPart,
  ReasoningPart,
  TextPart,
  StepStartPart,
  StepFinishPart,
  SubtaskPart,
  AgentPart,
} from "@opencode-ai/sdk/v2/client"

// ── Types ──────────────────────────────────────────────────────────────────

export type FlowNodeKind =
  | "user-message"
  | "reasoning"
  | "tool-call"
  | "tool-result"
  | "text-generation"
  | "step-start"
  | "step-end"
  | "sub-agent-spawn"
  | "agent-switch"

export interface FlowNode {
  id: string
  kind: FlowNodeKind
  timestamp: number
  /** Duration in ms, undefined if still running */
  duration?: number
  /** Whether this node is currently "active" (streaming / executing) */
  active: boolean
  /** Human-readable title */
  title: string
  /** Subtitle / detail text */
  subtitle?: string
  /** Tool name for tool-call nodes */
  toolName?: string
  /** Status for tool calls */
  toolStatus?: "pending" | "running" | "completed" | "error"
  /** Expanded detail content */
  detail?: string
  /** For step-end nodes: token and cost metrics */
  tokens?: {
    input: number
    output: number
    reasoning: number
    total?: number
    cacheRead: number
    cacheWrite: number
  }
  cost?: number
  /** For reasoning nodes: first ~120 chars preview */
  preview?: string
  /** Agent name for agent-switch/sub-agent nodes */
  agentName?: string
  /** Sub-agent progress */
  subAgentProgress?: number
}

export interface StepMetrics {
  input: number
  output: number
  reasoning: number
  total: number
  cacheRead: number
  cacheWrite: number
  cost: number
}

export interface ExecutionFlowState {
  /** All flow nodes for current session, newest at bottom */
  nodes: FlowNode[]
  /** Summary metrics across all steps */
  metrics: StepMetrics
  /** Whether the session is currently executing */
  busy: boolean
  /** Current agent name */
  currentAgent?: string
  /** Total steps in the current execution */
  totalSteps: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtTime(ms: number | undefined): string {
  if (typeof ms !== "number") return ""
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function fmtDuration(ms: number | undefined): string {
  if (typeof ms !== "number") return ""
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.round((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

function fmtCost(cents: number | undefined): string {
  if (typeof cents !== "number") return ""
  if (cents === 0) return "$0.00"
  if (cents < 1) return `<$0.01`
  return `$${(cents / 100).toFixed(2)}`
}

function fmtTokens(n: number | undefined): string {
  if (typeof n !== "number") return "0"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

/** Extract a short preview from reasoning text */
function reasoningPreview(text: string): string {
  if (!text) return ""
  const trimmed = text.trim()
  if (trimmed.length <= 120) return trimmed
  return trimmed.slice(0, 117) + "..."
}

const emptyParts: Part[] = []
const emptyMessages: Message[] = []

// ── State derivation ───────────────────────────────────────────────────────

function deriveExecutionFlow(
  messages: () => Message[],
  parts: (messageID: string) => Part[],
  sessionStatus: () => string | undefined,
): ExecutionFlowState {
  const nodes: FlowNode[] = []
  const metrics: StepMetrics = {
    input: 0,
    output: 0,
    reasoning: 0,
    total: 0,
    cacheRead: 0,
    cacheWrite: 0,
    cost: 0,
  }
  let totalSteps = 0
  let currentAgent: string | undefined
  const isBusy = sessionStatus() === "busy"

  const msgs = messages()

  for (const msg of msgs) {
    if (msg.role === "user") {
      nodes.push({
        id: `user-${msg.id}`,
        kind: "user-message",
        timestamp: msg.time.created,
        active: false,
        title: "User message",
      })
      continue
    }

    if (msg.role !== "assistant") continue
    const asst = msg as AssistantMessage
    const msgParts = parts(asst.id) ?? emptyParts

    // Track agent switches
    if (asst.agent) {
      if (currentAgent !== asst.agent) {
        nodes.push({
          id: `agent-switch-${asst.id}`,
          kind: "agent-switch",
          timestamp: asst.time.created,
          active: false,
          title: `Switched to ${asst.agent}`,
          agentName: asst.agent,
        })
        currentAgent = asst.agent
      }
    }

    for (const part of msgParts) {
      const partTime =
        "time" in part
          ? (part as { time?: { start?: number; end?: number } }).time
          : undefined

      switch (part.type) {
        case "step-start": {
          totalSteps++
          nodes.push({
            id: part.id,
            kind: "step-start",
            timestamp: partTime?.start ?? asst.time.created,
            active: partTime ? !partTime.end : false,
            title: `Step ${totalSteps} started`,
          })
          break
        }

        case "step-finish": {
          const sf = part as StepFinishPart
          const duration =
            sf.time?.end && sf.time?.start ? sf.time.end - sf.time.start : undefined
          metrics.input += sf.tokens.input
          metrics.output += sf.tokens.output
          metrics.reasoning += sf.tokens.reasoning
          metrics.total += sf.tokens.total ?? sf.tokens.input + sf.tokens.output + sf.tokens.reasoning
          metrics.cacheRead += sf.tokens.cache.read
          metrics.cacheWrite += sf.tokens.cache.write
          metrics.cost += sf.cost

          nodes.push({
            id: part.id,
            kind: "step-end",
            timestamp: sf.time?.end ?? asst.time.created,
            duration,
            active: false,
            title: `Step ${totalSteps} complete`,
            subtitle: `Cost: ${fmtCost(sf.cost)} · Tokens: ${fmtTokens(sf.tokens.total ?? sf.tokens.input + sf.tokens.output + sf.tokens.reasoning)}`,
            tokens: {
              input: sf.tokens.input,
              output: sf.tokens.output,
              reasoning: sf.tokens.reasoning,
              total: sf.tokens.total,
              cacheRead: sf.tokens.cache.read,
              cacheWrite: sf.tokens.cache.write,
            },
            cost: sf.cost,
          })
          break
        }

        case "reasoning": {
          const rp = part as ReasoningPart
          const duration =
            rp.time?.end && rp.time?.start ? rp.time.end - rp.time.start : undefined
          const isActive = isBusy && !rp.time?.end
          nodes.push({
            id: part.id,
            kind: "reasoning",
            timestamp: rp.time.start,
            duration,
            active: isActive,
            title: "Thinking",
            subtitle: isActive ? "Analyzing..." : fmtDuration(duration),
            preview: reasoningPreview(rp.text),
            detail: rp.text,
          })
          break
        }

        case "tool": {
          const tp = part as ToolPart
          const stateTime =
            "time" in tp.state
              ? (tp.state as { time?: { start?: number; end?: number } }).time
              : undefined
          const duration =
            stateTime?.end && stateTime?.start
              ? stateTime.end - stateTime.start
              : undefined
          const isActive = isBusy && tp.state.status === "running"

          // Tool call node
          nodes.push({
            id: `tool-call-${part.id}`,
            kind: "tool-call",
            timestamp: stateTime?.start ?? asst.time.created,
            duration,
            active: isActive,
            title: formatToolName(tp.tool),
            subtitle: isActive
              ? "Running..."
              : tp.state.status === "error"
                ? "Failed"
                : fmtDuration(duration),
            toolName: tp.tool,
            toolStatus: tp.state.status,
            detail:
              "input" in tp.state
                ? JSON.stringify(tp.state.input, null, 2)
                : undefined,
          })

          // Tool result node (for completed/error)
          if (tp.state.status === "completed" || tp.state.status === "error") {
            nodes.push({
              id: `tool-result-${part.id}`,
              kind: "tool-result",
              timestamp: stateTime?.end ?? asst.time.created,
              active: false,
              title:
                tp.state.status === "completed" ? "Result" : "Error",
              subtitle:
                tp.state.status === "completed"
                  ? truncate(tp.state.output, 120)
                  : "error" in tp.state
                    ? truncate((tp.state as { error: string }).error, 120)
                    : undefined,
              toolName: tp.tool,
              toolStatus: tp.state.status,
              detail:
                tp.state.status === "completed"
                  ? tp.state.output
                  : "error" in tp.state
                    ? (tp.state as { error: string }).error
                    : undefined,
            })
          }
          break
        }

        case "text": {
          const tpart = part as TextPart
          const tTime = tpart.time
          const duration = tTime?.end && tTime?.start ? tTime.end - tTime.start : undefined
          const isActive = isBusy && !tTime?.end
          // Only show non-empty text parts
          if (tpart.text || isActive) {
            nodes.push({
              id: part.id,
              kind: "text-generation",
              timestamp: tTime?.start ?? asst.time.created,
              duration,
              active: isActive,
              title: "Response",
              subtitle: isActive ? "Generating..." : fmtDuration(duration),
              detail: tpart.text,
            })
          }
          break
        }

        case "subtask": {
          const sp = part as SubtaskPart
          nodes.push({
            id: part.id,
            kind: "sub-agent-spawn",
            timestamp: asst.time.created,
            active: false,
            title: `Sub-agent: ${sp.agent}`,
            subtitle: sp.description,
            agentName: sp.agent,
            detail: sp.prompt,
          })
          break
        }

        case "agent": {
          const ap = part as AgentPart
          nodes.push({
            id: part.id,
            kind: "agent-switch",
            timestamp: asst.time.created,
            active: false,
            title: `Agent: ${ap.name}`,
            agentName: ap.name,
          })
          break
        }
      }
    }
  }

  return {
    nodes,
    metrics,
    busy: isBusy,
    currentAgent,
    totalSteps,
  }
}

// ── Formatting helpers ─────────────────────────────────────────────────────

function formatToolName(tool: string): string {
  return tool
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function truncate(text: string, max: number): string {
  if (!text) return ""
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return trimmed.slice(0, max - 3) + "..."
}

// ── Context ────────────────────────────────────────────────────────────────

export interface ExecutionFlowContextType {
  flow: () => ExecutionFlowState
  fmtTime: (ms: number | undefined) => string
  fmtDuration: (ms: number | undefined) => string
  fmtCost: (cents: number | undefined) => string
  fmtTokens: (n: number | undefined) => string
}

const ExecutionFlowContext = createContext<ExecutionFlowContextType>()

export function ExecutionFlowProvider(props: ParentProps) {
  const sync = useSync()
  const { params } = useSessionLayout()

  const sessionID = () => params.id

  const messages = createMemo(() => {
    const id = sessionID()
    if (!id) return emptyMessages
    return sync().data.message[id] ?? emptyMessages
  })

  const partsFor = (messageID: string): Part[] => {
    const id = sessionID()
    if (!id) return emptyParts
    return sync().data.part[messageID] ?? emptyParts
  }

  const sessionStatus = createMemo(() => {
    const id = sessionID()
    if (!id) return undefined
    const status = sync().data.session_status[id]
    return status?.status
  })

  const flow = createMemo(() =>
    deriveExecutionFlow(messages, partsFor, sessionStatus()),
  )

  const value: ExecutionFlowContextType = {
    flow,
    fmtTime,
    fmtDuration,
    fmtCost,
    fmtTokens,
  }

  return (
    <ExecutionFlowContext.Provider value={value}>
      {props.children}
    </ExecutionFlowContext.Provider>
  )
}

export function useExecutionFlow(): ExecutionFlowContextType {
  const ctx = useContext(ExecutionFlowContext)
  if (!ctx)
    throw new Error(
      "useExecutionFlow must be used within an ExecutionFlowProvider",
    )
  return ctx
}
