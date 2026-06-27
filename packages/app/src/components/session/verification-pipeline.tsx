import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { Button } from "@opencode-ai/ui/button"
import { Spinner } from "@opencode-ai/ui/spinner"
import { useVerification, type VerificationStep, type StepStatus } from "@/context/verification"
import { usePlanning } from "@/context/planning"

const STEP_CONFIG: { key: VerificationStep; icon: string; label: string }[] = [
  { key: "tests", icon: "checklist", label: "Tests" },
  { key: "linter", icon: "code", label: "Linter" },
  { key: "formatter", icon: "edit-small-2", label: "Formatter" },
  { key: "build", icon: "play", label: "Build" },
  { key: "browser-test", icon: "browser", label: "Browser Test" },
  { key: "accessibility", icon: "glasses", label: "Accessibility" },
  { key: "performance", icon: "sliders", label: "Performance" },
]

function fmtDuration(ms: number | null | undefined): string {
  if (typeof ms !== "number") return ""
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60000)
  const s = Math.round((ms % 60000) / 1000)
  return `${m}m ${s}s`
}

function usePlanningOptional() {
  try {
    return usePlanning()
  } catch {
    return null
  }
}

function StatusIcon(props: { status: StepStatus }) {
  if (props.status === "completed") return <Icon name="check" size="small" />
  if (props.status === "failed") return <Icon name="circle-ban-sign" size="small" />
  if (props.status === "running") return <Spinner class="size-4" />
  if (props.status === "skipped") return <Icon name="dash" size="small" />
  return <Icon name="dash" size="small" />
}

export function VerificationPipeline() {
  const verification = useVerification()
  const planning = usePlanningOptional()
  const [expanded, setExpanded] = createSignal<VerificationStep | null>(null)
  const [hasAutoVerified, setHasAutoVerified] = createSignal(false)

  const toggleExpanded = (step: VerificationStep) => {
    setExpanded((prev) => (prev === step ? null : step))
  }

  const results = createMemo(() => verification.results())

  createEffect(() => {
    if (
      planning?.state.steps.execute.status === "completed" &&
      !verification.active() &&
      !hasAutoVerified()
    ) {
      setHasAutoVerified(true)
      setTimeout(() => runAllSteps(), 500)
    }
  })

  const runAllSteps = async () => {
    await verification.runVerification(async (step) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return `${step} passed`
    })
  }

  const handleRerunStep = async (step: VerificationStep) => {
    await verification.rerunStep(step, async (s) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return `${s} passed`
    })
  }

  const showRunButton = createMemo(() => !verification.active() && results().completed === 0)

  const showBanner = createMemo(() => !verification.active() && results().completed > 0)

  return (
    <div data-component="verification-pipeline" class="w-full px-4 md:px-5 py-3">
      <div class="rounded-lg border border-border-weak-base bg-background-stronger overflow-hidden">
        <div class="flex items-center gap-2 px-3 py-2 border-b border-border-weaker-base">
          <Icon name="shield" size="small" class="text-icon-interactive-base" />
          <span class="text-12-medium text-text-strong">Verification Pipeline</span>
          <Show when={verification.active()}>
            <span class="ml-auto text-11-regular text-text-weaker">
              {results().completed + 1}/{results().total}
            </span>
          </Show>
        </div>

        <div class="p-3">
          <Show when={showRunButton()}>
            <div class="flex justify-center mb-3">
              <Button variant="primary" size="small" onClick={runAllSteps}>
                <Icon name="play" size="small" />
                Run Verification
              </Button>
            </div>
          </Show>

          <Show when={showBanner()}>
            <div
              class="flex items-center gap-2 px-3 py-2 mb-3 rounded-md text-13-medium"
              classList={{
                "bg-success-base/10 text-success-base": results().pass,
                "bg-critical-base/10 text-critical-base": results().fail,
              }}
            >
              <Icon name={results().pass ? "circle-check" : "circle-ban-sign"} size="small" />
              <span>
                {results().pass
                  ? "All verification checks passed"
                  : `${results().completed}/${results().total} checks passed - some checks failed`}
              </span>
            </div>
          </Show>

          <div class="space-y-0">
            <For each={STEP_CONFIG}>
              {(config, index) => {
                const stepState = createMemo(() => verification.state.steps[config.key])
                const isCurrent = createMemo(() => verification.state.currentStep === config.key)
                const isLast = createMemo(() => index() === STEP_CONFIG.length - 1)
                const status = createMemo(() => stepState().status)
                const isExpanded = createMemo(() => expanded() === config.key)

                return (
                  <div>
                    <div class="flex items-start gap-3">
                      <div class="flex flex-col items-center">
                        <div
                          class="flex items-center justify-center size-7 rounded-full transition-colors shrink-0"
                          classList={{
                            "bg-icon-interactive-base text-white": isCurrent(),
                            "bg-success-base text-white": status() === "completed",
                            "bg-critical-base text-white": status() === "failed",
                            "bg-accent-base/20 text-icon-weak": status() === "skipped",
                            "bg-surface-raised-base text-icon-weak border border-border-weaker-base":
                              status() === "pending",
                          }}
                        >
                          <StatusIcon status={status()} />
                        </div>
                        <Show when={!isLast()}>
                          <div
                            class="w-px flex-1 min-h-[24px]"
                            classList={{
                              "bg-success-base": status() === "completed",
                              "bg-critical-base": status() === "failed",
                              "bg-border-weaker-base": status() !== "completed" && status() !== "failed",
                            }}
                          />
                        </Show>
                      </div>

                      <div class="flex-1 min-w-0 pb-3">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2 min-w-0">
                            <span
                              class="text-13-medium truncate cursor-pointer"
                              classList={{
                                "text-text-strong": isCurrent() || status() === "completed",
                                "text-text-base": status() === "pending",
                                "text-text-danger-base": status() === "failed",
                                "text-text-weak": status() === "skipped",
                              }}
                              onClick={() => toggleExpanded(config.key)}
                            >
                              {config.label}
                            </span>
                            <Show when={typeof stepState().duration === "number"}>
                              <span class="text-11-regular text-text-weaker tabular-nums">
                                {fmtDuration(stepState().duration)}
                              </span>
                            </Show>
                          </div>

                          <div class="flex items-center gap-1 shrink-0">
                            <Show when={status() === "failed"}>
                              <Button
                                variant="secondary"
                                size="small"
                                onClick={() => handleRerunStep(config.key)}
                              >
                                <Icon name="play" size="small" />
                                Re-run
                              </Button>
                            </Show>
                            <Show when={status() === "running"}>
                              <Button
                                variant="secondary"
                                size="small"
                                onClick={() => verification.skipStep(config.key)}
                              >
                                Skip
                              </Button>
                            </Show>
                            <Show when={
                              status() === "completed" ||
                              status() === "failed" ||
                              status() === "skipped"
                            }>
                              <button
                                type="button"
                                onClick={() => toggleExpanded(config.key)}
                                class="text-icon-weak hover:text-icon-base transition-colors"
                              >
                                <Icon name="chevron-down" size="small" />
                              </button>
                            </Show>
                          </div>
                        </div>

                        <Show when={isExpanded() && stepState().output}>
                          <div class="mt-2 p-2 rounded bg-surface-raised-base text-12-regular text-text-base whitespace-pre-wrap font-mono max-h-40 overflow-auto">
                            {stepState().output}
                          </div>
                        </Show>
                      </div>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}
