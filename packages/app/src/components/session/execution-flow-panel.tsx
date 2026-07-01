import { createMemo, createSignal, For, Show } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import {
  useExecutionFlow,
  type FlowNode,
  type FlowNodeKind,
  type StepMetrics,
} from "@/context/execution-flow"

// ── Constants ──────────────────────────────────────────────────────────────

const NODE_ICON: Record<FlowNodeKind, { name: string; cls: string }> = {
  "user-message": { name: "speech-bubble", cls: "text-accent-base" },
  reasoning: { name: "brain", cls: "text-accent-interactive" },
  "tool-call": { name: "play", cls: "text-icon-warning" },
  "tool-result": { name: "check-small", cls: "text-icon-success" },
  "text-generation": { name: "code-lines", cls: "text-icon-base" },
  "step-start": { name: "chevron-right", cls: "text-icon-interactive-base" },
  "step-end": { name: "circle-check", cls: "text-icon-success" },
  "sub-agent-spawn": { name: "branch", cls: "text-accent-base" },
  "agent-switch": { name: "branch", cls: "text-accent-base" },
}

// ── Metrics Bar ────────────────────────────────────────────────────────────

function MetricsBar(props: { metrics: StepMetrics; totalSteps: number; busy: boolean }) {
  const totalTokens = () => props.metrics.total
  return (
    <div class="flex items-center gap-3 flex-wrap">
      <Show when={props.totalSteps > 0}>
        <MetricChip icon="task" label="Steps" value={`${props.totalSteps}`} />
      </Show>
      <Show when={totalTokens() > 0}>
        <MetricChip icon="code-lines" label="Tokens" value={fmtTokensShort(totalTokens())} />
      </Show>
      <Show when={props.metrics.input > 0}>
        <MetricChip icon="arrow-right" label="In" value={fmtTokensShort(props.metrics.input)} />
      </Show>
      <Show when={props.metrics.output > 0}>
        <MetricChip icon="arrow-right" label="Out" value={fmtTokensShort(props.metrics.output)} />
      </Show>
      <Show when={props.metrics.reasoning > 0}>
        <MetricChip icon="brain" label="Think" value={fmtTokensShort(props.metrics.reasoning)} />
      </Show>
      <Show when={props.metrics.cost > 0}>
        <MetricChip icon="status" label="Cost" value={fmtCostShort(props.metrics.cost)} />
      </Show>
      <Show when={props.busy}>
        <div class="flex items-center gap-1.5 ml-auto">
          <span class="size-1.5 rounded-full bg-icon-warning animate-pulse" />
          <span class="text-11-regular text-icon-warning">Executing</span>
        </div>
      </Show>
    </div>
  )
}

function MetricChip(props: { icon: string; label: string; value: string }) {
  return (
    <div class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-raised-base border border-border-weaker-base">
      <Icon name={props.icon as any} size="small" class="text-icon-weak" />
      <span class="text-11-regular text-text-weaker">{props.label}</span>
      <span class="text-12-medium text-text-strong tabular-nums">{props.value}</span>
    </div>
  )
}

// ── Flow Node Row ──────────────────────────────────────────────────────────

function FlowNodeRow(props: { node: FlowNode; expanded: boolean; onToggle: () => void }) {
  const iconInfo = () => NODE_ICON[props.node.kind]

  return (
    <div
      class="group relative"
      data-flow-node-id={props.node.id}
    >
      {/* Timeline connector line */}
      <div class="absolute left-[13px] top-8 bottom-0 w-px bg-border-weaker-base group-last:hidden" />

      <div
        class="flex items-start gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-surface-raised-base transition-colors"
        onClick={props.onToggle}
      >
        {/* Icon */}
        <div class="relative shrink-0 mt-0.5">
          <div
            class="size-[26px] rounded-full flex items-center justify-center border border-border-weaker-base bg-background-stronger"
            classList={{
              "border-icon-warning animate-pulse": props.node.active,
              "border-border-weaker-base": !props.node.active,
            }}
          >
            <Show
              when={!props.node.active}
              fallback={<Spinner size="small" class="text-icon-warning" />}
            >
              <Icon name={iconInfo().name as any} size="small" class={iconInfo().cls} />
            </Show>
          </div>
        </div>

        {/* Content */}
        <div class="min-w-0 flex-1 flex flex-col gap-0.5">
          <div class="flex items-center gap-2">
            <span class="text-12-medium text-text-strong">{props.node.title}</span>
            <Show when={props.node.toolName && props.node.kind === "tool-call"}>
              <ToolBadge name={props.node.toolName!} status={props.node.toolStatus} />
            </Show>
          </div>
          <Show when={props.node.subtitle}>
            <span class="text-11-regular text-text-weak">{props.node.subtitle}</span>
          </Show>
          <Show when={props.node.preview && !props.expanded}>
            <span class="text-11-regular text-text-weaker italic truncate max-w-full">
              {props.node.preview}
            </span>
          </Show>
        </div>

        {/* Duration / expand indicator */}
        <div class="shrink-0 flex items-center gap-2">
          <Show when={props.node.duration !== undefined}>
            <span class="text-11-regular text-text-weaker tabular-nums">
              {fmtDurationShort(props.node.duration)}
            </span>
          </Show>
          <Show when={props.node.detail}>
            <Icon
              name={props.expanded ? "chevron-down" : "chevron-right"}
              size="small"
              class="text-text-weak"
            />
          </Show>
        </div>
      </div>

      {/* Expanded detail */}
      <Show when={props.expanded && props.node.detail}>
        <div class="ml-[38px] mr-3 mb-2 mt-1">
          <DetailBlock node={props.node} />
        </div>
      </Show>
    </div>
  )
}

// ── Tool Badge ─────────────────────────────────────────────────────────────

function ToolBadge(props: { name: string; status?: string }) {
  const statusStyle = () => {
    switch (props.status) {
      case "running":
        return "bg-warning-base text-white"
      case "completed":
        return "bg-success-base text-white"
      case "error":
        return "bg-critical-base text-white"
      default:
        return "bg-surface-raised-base text-text-weak border border-border-weaker-base"
    }
  }

  return (
    <span
      class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
      classList={statusStyle()}
    >
      {props.name}
    </span>
  )
}

// ── Token Metrics for Step-End ─────────────────────────────────────────────

function StepMetricsRow(props: { tokens: FlowNode["tokens"]; cost?: number }) {
  if (!props.tokens) return null
  const t = props.tokens
  return (
    <div class="flex items-center gap-2 flex-wrap mt-1.5">
      <MiniMetric label="In" value={fmtTokensShort(t.input)} />
      <MiniMetric label="Out" value={fmtTokensShort(t.output)} />
      <Show when={t.reasoning > 0}>
        <MiniMetric label="Think" value={fmtTokensShort(t.reasoning)} />
      </Show>
      <Show when={(t.cacheRead ?? 0) > 0}>
        <MiniMetric label="Cache Read" value={fmtTokensShort(t.cacheRead)} />
      </Show>
      <Show when={(t.cacheWrite ?? 0) > 0}>
        <MiniMetric label="Cache Write" value={fmtTokensShort(t.cacheWrite)} />
      </Show>
      <Show when={props.cost !== undefined && props.cost > 0}>
        <MiniMetric label="Cost" value={fmtCostShort(props.cost!)} />
      </Show>
    </div>
  )
}

function MiniMetric(props: { label: string; value: string }) {
  return (
    <div class="flex items-center gap-1 text-11-regular">
      <span class="text-text-weaker">{props.label}:</span>
      <span class="text-text-strong tabular-nums">{props.value}</span>
    </div>
  )
}

// ── Detail Block ───────────────────────────────────────────────────────────

function DetailBlock(props: { node: FlowNode }) {
  return (
    <div class="rounded-lg border border-border-base bg-surface-base p-3 overflow-hidden">
      <Show when={props.node.kind === "step-end" && props.node.tokens}>
        <StepMetricsRow tokens={props.node.tokens!} cost={props.node.cost} />
      </Show>
      <Show when={props.node.kind === "reasoning" && props.node.detail}>
        <div class="mt-2">
          <div class="text-11-medium text-text-weaker mb-1">Thinking</div>
          <pre class="text-11-regular text-text-base whitespace-pre-wrap break-words max-h-64 overflow-y-auto leading-relaxed">
            {props.node.detail}
          </pre>
        </div>
      </Show>
      <Show when={props.node.kind === "tool-call" && props.node.detail}>
        <div class="mt-2">
          <div class="text-11-medium text-text-weaker mb-1">Input</div>
          <pre class="text-11-regular text-text-base whitespace-pre-wrap break-words max-h-64 overflow-y-auto leading-relaxed font-mono">
            {props.node.detail}
          </pre>
        </div>
      </Show>
      <Show when={(props.node.kind === "tool-result") && props.node.detail}>
        <div class="mt-2">
          <div class="text-11-medium text-text-weaker mb-1">
            {props.node.toolStatus === "error" ? "Error" : "Output"}
          </div>
          <pre class="text-11-regular text-text-base whitespace-pre-wrap break-words max-h-64 overflow-y-auto leading-relaxed font-mono">
            {props.node.detail}
          </pre>
        </div>
      </Show>
      <Show when={props.node.kind === "text-generation" && props.node.detail}>
        <div class="mt-2">
          <div class="text-11-medium text-text-weaker mb-1">Generated Text</div>
          <pre class="text-11-regular text-text-base whitespace-pre-wrap break-words max-h-64 overflow-y-auto leading-relaxed">
            {props.node.detail}
          </pre>
        </div>
      </Show>
      <Show when={props.node.kind === "sub-agent-spawn" && props.node.detail}>
        <div class="mt-2">
          <div class="text-11-medium text-text-weaker mb-1">Prompt</div>
          <pre class="text-11-regular text-text-base whitespace-pre-wrap break-words max-h-64 overflow-y-auto leading-relaxed">
            {props.node.detail}
          </pre>
        </div>
      </Show>
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState(props: { busy: boolean }) {
  return (
    <div class="h-full flex flex-col items-center justify-center text-center gap-3 px-6">
      <div class="size-12 rounded-xl bg-surface-raised-base flex items-center justify-center border border-border-weaker-base">
        <Icon name="brain" size="normal" class="text-icon-weak" />
      </div>
      <Show
        when={props.busy}
        fallback={
          <>
            <div class="text-13-medium text-text-strong">No execution flow yet</div>
            <div class="text-12-regular text-text-weak max-w-48">
              Start a session to see the agent's thought process and tool execution in real-time
            </div>
          </>
        }
      >
        <div class="flex items-center gap-2">
          <Spinner size="small" class="text-icon-interactive-base" />
          <span class="text-13-medium text-text-strong">Preparing execution...</span>
        </div>
      </Show>
    </div>
  )
}

// ── Main Panel ─────────────────────────────────────────────────────────────

export function ExecutionFlowPanel() {
  const { flow, fmtDuration, fmtCost, fmtTokens } = useExecutionFlow()
  const [expandedID, setExpandedID] = createSignal<string | null>(null)
  const [search, setSearch] = createSignal("")

  const toggle = (id: string) => {
    setExpandedID((prev) => (prev === id ? null : id))
  }

  const filteredNodes = createMemo(() => {
    const q = search().toLowerCase().trim()
    const all = flow().nodes
    if (!q) return all
    return all.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.subtitle?.toLowerCase().includes(q) ||
        n.toolName?.toLowerCase().includes(q) ||
        n.agentName?.toLowerCase().includes(q),
    )
  })

  return (
    <ScrollView class="h-full contain-strict">
      <div class="px-3 pt-3 pb-6 flex flex-col gap-1">
        {/* Header */}
        <div class="px-1 pb-2 flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Icon name="task" size="small" class="text-icon-interactive-base" />
              <span class="text-13-medium text-text-strong">Execution Flow</span>
            </div>
            <Show when={flow().currentAgent}>
              <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-raised-base border border-border-weaker-base">
                <span
                  class="size-1.5 rounded-full"
                  classList={{ "bg-icon-warning animate-pulse": flow().busy, "bg-icon-success": !flow().busy }}
                />
                <span class="text-11-regular text-text-weak">{flow().currentAgent}</span>
              </div>
            </Show>
          </div>

          {/* Metrics bar */}
          <Show when={flow().nodes.length > 0}>
            <MetricsBar metrics={flow().metrics} totalSteps={flow().totalSteps} busy={flow().busy} />
          </Show>
        </div>

        {/* Search */}
        <div class="relative px-1 pb-2">
          <div class="absolute left-4 top-1/2 -translate-y-1/2 text-icon-weak pointer-events-none flex items-center justify-center">
            <Icon name="magnifying-glass" size="small" />
          </div>
          <input
            type="text"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            placeholder="Search flow..."
            class="w-full h-8 pl-8 pr-3 text-13-regular text-text-strong bg-surface-base rounded-md border border-border-base outline-none placeholder:text-text-weaker"
          />
        </div>

        {/* Flow nodes */}
        <Show
          when={filteredNodes().length > 0}
          fallback={<EmptyState busy={flow().busy} />}
        >
          <For each={filteredNodes()}>
            {(node) => (
              <FlowNodeRow
                node={node}
                expanded={expandedID() === node.id}
                onToggle={() => toggle(node.id)}
              />
            )}
          </For>
        </Show>
      </div>
    </ScrollView>
  )
}

// ── Formatting Helpers ─────────────────────────────────────────────────────

function fmtDurationShort(ms: number | undefined): string {
  if (typeof ms !== "number") return ""
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.round((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

function fmtTokensShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

function fmtCostShort(cents: number): string {
  if (cents === 0) return "$0.00"
  if (cents < 1) return "<$0.01"
  return `$${(cents / 100).toFixed(2)}`
}
