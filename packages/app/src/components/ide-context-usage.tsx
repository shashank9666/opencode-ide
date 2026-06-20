import { Show, createMemo } from "solid-js"
import { ProgressCircle } from "@opencode-ai/ui/progress-circle"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { useLanguage } from "@/context/language"
import { useProviders } from "@/hooks/use-providers"
import { useSync } from "@/context/sync"
import { getSessionContextMetrics } from "@/components/session/session-context-metrics"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { IdeContextModal } from "./ide-context-modal"

export function IdeContextUsage(props: { activeSessionId: string | null }) {
  const sync = useSync()
  const language = useLanguage()
  const providers = useProviders()
  const dialog = useDialog()

  const messages = createMemo(() => (props.activeSessionId ? (sync().data.message[props.activeSessionId] ?? []) : []))

  const usd = createMemo(
    () =>
      new Intl.NumberFormat(language.intl(), {
        style: "currency",
        currency: "USD",
      }),
  )

  const metrics = createMemo(() => getSessionContextMetrics(messages(), [...providers.all().values()]))
  const context = createMemo(() => metrics().context)
  const cost = createMemo(() => usd().format(metrics().totalCost))

  const tooltipValue = () => (
    <div>
      <Show when={context()}>
        {(ctx) => (
          <>
            <div class="flex items-center gap-2">
              <span class="text-text-invert-strong">{ctx().total.toLocaleString(language.intl())}</span>
              <span class="text-text-invert-base">{language.t("context.usage.tokens")}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-text-invert-strong">{ctx().usage ?? 0}%</span>
              <span class="text-text-invert-base">{language.t("context.usage.usage")}</span>
            </div>
          </>
        )}
      </Show>
      <div class="flex items-center gap-2">
        <span class="text-text-invert-strong">{cost()}</span>
        <span class="text-text-invert-base">{language.t("context.usage.cost")}</span>
      </div>
    </div>
  )

  return (
    <Show when={props.activeSessionId && context() && context()!.total > 0}>
      <Tooltip value={tooltipValue()} placement="top">
        <button
          type="button"
          class="flex items-center gap-1.5 px-2 h-full hover:bg-surface-raised-base-hover transition-colors cursor-pointer"
          onClick={() => {
            if (props.activeSessionId) {
              dialog.show(() => <IdeContextModal sessionId={props.activeSessionId!} />)
            }
          }}
        >
          <ProgressCircle size={14} strokeWidth={2} percentage={context()?.usage ?? 0} />
          <span class="text-11-medium">{context()!.total.toLocaleString(language.intl())}</span>
        </button>
      </Tooltip>
    </Show>
  )
}
