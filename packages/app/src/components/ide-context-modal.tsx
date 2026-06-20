import { createMemo, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import { useSync } from "@/context/sync"
import { useLanguage } from "@/context/language"
import { useProviders } from "@/hooks/use-providers"
import { getSessionContextMetrics } from "@/components/session/session-context-metrics"
import { estimateSessionContextBreakdown, type SessionContextBreakdownKey } from "@/components/session/session-context-breakdown"
import { createSessionContextFormatter } from "@/components/session/session-context-format"
import { findLast } from "@opencode-ai/core/util/array"
import type { Message, UserMessage, Part } from "@opencode-ai/sdk/v2/client"
import { Dialog } from "@opencode-ai/ui/dialog"
import { same } from "@/utils/same"

const BREAKDOWN_COLOR: Record<SessionContextBreakdownKey, string> = {
  system: "var(--syntax-info)",
  user: "var(--syntax-success)",
  assistant: "var(--syntax-property)",
  tool: "var(--syntax-warning)",
  other: "var(--syntax-comment)",
}

function Stat(props: { label: string; value: JSX.Element }) {
  return (
    <div class="flex flex-col gap-1">
      <div class="text-12-regular text-text-weak">{props.label}</div>
      <div class="text-12-medium text-text-strong">{props.value}</div>
    </div>
  )
}

export function IdeContextModal(props: { sessionId: string }) {
  const sync = useSync()
  const language = useLanguage()
  const providers = useProviders()

  const info = createMemo(() => sync().session.get(props.sessionId))
  const messages = createMemo(
    () => (sync().data.message[props.sessionId] ?? []) as Message[],
    [],
    { equals: same },
  )

  const userMessages = createMemo(
    () => messages().filter((m) => m.role === "user") as UserMessage[],
    [],
    { equals: same },
  )

  const visibleUserMessages = createMemo(
    () => {
      const revert = info()?.revert?.messageID
      if (!revert) return userMessages()
      return userMessages().filter((m) => m.id < revert)
    },
    [],
    { equals: same },
  )

  const usd = createMemo(
    () =>
      new Intl.NumberFormat(language.intl(), {
        style: "currency",
        currency: "USD",
      }),
  )

  const metrics = createMemo(() => getSessionContextMetrics(messages(), [...providers.all().values()]))
  const ctx = createMemo(() => metrics().context)
  const formatter = createMemo(() => createSessionContextFormatter(language.intl()))

  const cost = createMemo(() => usd().format(metrics().totalCost))

  const counts = createMemo(() => {
    const all = messages()
    const user = all.reduce((count, x) => count + (x.role === "user" ? 1 : 0), 0)
    const assistant = all.reduce((count, x) => count + (x.role === "assistant" ? 1 : 0), 0)
    return {
      all: all.length,
      user,
      assistant,
    }
  })

  const systemPrompt = createMemo(() => {
    const msg = findLast(visibleUserMessages(), (m) => !!m.system)
    const system = msg?.system
    if (!system) return
    const trimmed = system.trim()
    if (!trimmed) return
    return trimmed
  })

  const providerLabel = createMemo(() => ctx()?.providerLabel ?? "—")
  const modelLabel = createMemo(() => ctx()?.modelLabel ?? "—")

  const breakdown = createMemo(() => {
    const c = ctx()
    if (!c?.input) return []
    return estimateSessionContextBreakdown({
      messages: messages(),
      parts: sync().data.part as Record<string, Part[] | undefined>,
      input: c.input,
      systemPrompt: systemPrompt(),
    })
  })

  const breakdownLabel = (key: SessionContextBreakdownKey) => {
    if (key === "system") return language.t("context.breakdown.system")
    if (key === "user") return language.t("context.breakdown.user")
    if (key === "assistant") return language.t("context.breakdown.assistant")
    if (key === "tool") return language.t("context.breakdown.tool")
    return language.t("context.breakdown.other")
  }

  const stats = [
    { label: "context.stats.session", value: () => info()?.title ?? props.sessionId ?? "—" },
    { label: "context.stats.messages", value: () => counts().all.toLocaleString(language.intl()) },
    { label: "context.stats.provider", value: providerLabel },
    { label: "context.stats.model", value: modelLabel },
    { label: "context.stats.limit", value: () => formatter().number(ctx()?.limit) },
    { label: "context.stats.totalTokens", value: () => formatter().number(ctx()?.total) },
    { label: "context.stats.usage", value: () => formatter().percent(ctx()?.usage) },
    { label: "context.stats.inputTokens", value: () => formatter().number(ctx()?.input) },
    { label: "context.stats.outputTokens", value: () => formatter().number(ctx()?.output) },
    { label: "context.stats.reasoningTokens", value: () => formatter().number(ctx()?.reasoning) },
    {
      label: "context.stats.cacheTokens",
      value: () => `${formatter().number(ctx()?.cacheRead)} / ${formatter().number(ctx()?.cacheWrite)}`,
    },
    { label: "context.stats.userMessages", value: () => counts().user.toLocaleString(language.intl()) },
    { label: "context.stats.assistantMessages", value: () => counts().assistant.toLocaleString(language.intl()) },
    { label: "context.stats.totalCost", value: cost },
    { label: "context.stats.sessionCreated", value: () => formatter().time(info()?.time.created) },
    { label: "context.stats.lastActivity", value: () => formatter().time(ctx()?.message.time.created) },
  ] satisfies { label: string; value: () => JSX.Element }[]

  return (
    <Dialog title={language.t("session.tab.context")} size="x-large">
      <div class="px-6 py-4 flex flex-col gap-10 max-h-[80vh] overflow-y-auto">
        <div class="grid grid-cols-2 gap-4">
          <For each={stats}>
            {(stat) => <Stat label={language.t(stat.label as Parameters<typeof language.t>[0])} value={stat.value()} />}
          </For>
        </div>

        <Show when={breakdown().length > 0}>
          <div class="flex flex-col gap-2">
            <div class="text-12-regular text-text-weak">{language.t("context.breakdown.title")}</div>
            <div class="h-2 w-full rounded-full bg-surface-base overflow-hidden flex">
              <For each={breakdown()}>
                {(segment) => (
                  <div
                    class="h-full"
                    style={{
                      width: `${segment.width}%`,
                      "background-color": BREAKDOWN_COLOR[segment.key],
                    }}
                  />
                )}
              </For>
            </div>
            <div class="flex flex-wrap gap-x-3 gap-y-1">
              <For each={breakdown()}>
                {(segment) => (
                  <div class="flex items-center gap-1 text-11-regular text-text-weak">
                    <div class="size-2 rounded-sm" style={{ "background-color": BREAKDOWN_COLOR[segment.key] }} />
                    <div>{breakdownLabel(segment.key)}</div>
                    <div class="text-text-weaker">{segment.percent.toLocaleString(language.intl())}%</div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </Dialog>
  )
}
