import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Logo } from "@opencode-ai/ui/logo"
import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import { useLanguage } from "@/context/language"
import { useNavigate } from "@solidjs/router"
import { useServerSDK } from "@/context/server-sdk"
import { useServerSync } from "@/context/server-sync"
import { useProviders } from "@/hooks/use-providers"
import { base64Encode } from "@opencode-ai/core/util/encode"
import { useDirectoryPicker } from "@/components/directory-picker"
import { DialogSelectProvider } from "./dialog-select-provider"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { useServer } from "@/context/server"

type StepID = "welcome" | "connectProvider" | "openProject" | "firstPrompt" | "complete"

const STEPS: { id: StepID }[] = [
  { id: "welcome" },
  { id: "connectProvider" },
  { id: "openProject" },
  { id: "firstPrompt" },
  { id: "complete" },
]

export const ONBOARDING_DISMISSED_KEY = "opencode.onboarding.dismissed"

export function shouldShowOnboarding() {
  try {
    return localStorage.getItem(ONBOARDING_DISMISSED_KEY) !== "true"
  } catch {
    return false
  }
}

export function dismissOnboarding() {
  try {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true")
  } catch {}
}

export function DialogOnboardingWizard() {
  const dialog = useDialog()
  const language = useLanguage()
  const navigate = useNavigate()
  const serverSDK = useServerSDK()
  const serverSync = useServerSync()
  const providers = useProviders()
  const pickDirectory = useDirectoryPicker()
  const server = useServer()

  const [stepIndex, setStepIndex] = createSignal(0)
  const step = createMemo(() => STEPS[stepIndex()]?.id ?? "welcome")
  const isLast = createMemo(() => stepIndex() >= STEPS.length - 1)
  const isFirst = createMemo(() => stepIndex() <= 0)
  const total = STEPS.length

  const hasConnectedProviders = createMemo(() => providers.connected().length > 0)
  const hasProjects = createMemo(() => {
    const dirs = serverSync().data.project
    return dirs.length > 0
  })

  function goNext() {
    const next = stepIndex() + 1
    if (next < STEPS.length) {
      setStepIndex(next)
    }
  }

  function goBack() {
    const prev = stepIndex() - 1
    if (prev >= 0) {
      setStepIndex(prev)
    }
  }

  function handleSkip() {
    dismissOnboarding()
    dialog.close()
  }

  function handleDone() {
    dismissOnboarding()
    dialog.close()
  }

  function handleConnectProvider() {
    dialog.show(() => <DialogSelectProvider />)
  }

  function handleOpenProject() {
    const s = server.current
    if (!s) {
      navigate("/")
      dialog.close()
      return
    }
    pickDirectory({
      server: s,
      title: language.t("command.project.open"),
      multiple: false,
      onSelect: (result) => {
        if (!result) return
        const directory = Array.isArray(result) ? result[0] : result
        if (!directory) return
        const ctx = createServerCtx(s, serverSDK().scope)
        ctx.projects.open(directory)
        ctx.projects.touch(directory)
        navigate(`/${base64Encode(directory)}/session`)
        dialog.close()
      },
    })
  }

  function handleFirstPrompt() {
    const projects = serverSync().data.project
    if (projects.length > 0) {
      navigate(`/${base64Encode(projects[0].worktree)}/session`)
    } else {
      navigate("/")
    }
    dialog.close()
  }

  return (
    <Dialog transition>
      <div class="flex flex-col gap-6 px-2.5 pb-3">
        {/* Step Indicator */}
        <div class="flex items-center justify-between px-2.5 pt-1">
          <div class="flex items-center gap-1.5">
            <For each={STEPS}>
              {(_, i) => (
                <div
                  class="h-1 rounded-full transition-all duration-300"
                  classList={{
                    "w-6 bg-v2-background-bg-layer-04": i() === stepIndex(),
                    "w-2 bg-v2-border-border-base": i() !== stepIndex(),
                  }}
                />
              )}
            </For>
          </div>
          <button
            type="button"
            class="text-[11px] leading-none tracking-[-0.01px] text-v2-text-text-faint hover:text-v2-text-text-muted transition-colors [font-weight:530]"
            onClick={handleSkip}
          >
            {language.t("onboarding.action.skip")}
          </button>
        </div>

        {/* Content */}
        <div class="px-2.5 flex flex-col gap-6 min-h-[280px]">
          <Switch>
            <Match when={step() === "welcome"}>
              <div class="flex flex-col items-center gap-4 pt-4">
                <Logo class="size-12 opacity-80" />
                <div class="flex flex-col items-center gap-2 text-center">
                  <h2 class="text-[18px] leading-6 tracking-[-0.18px] text-v2-text-text-base [font-weight:600]">
                    {language.t("onboarding.welcome.title")}
                  </h2>
                  <p class="text-[13px] leading-[18px] tracking-[-0.04px] text-v2-text-text-muted [font-weight:440] max-w-[320px]">
                    {language.t("onboarding.welcome.description")}
                  </p>
                </div>
                <div class="mt-2 flex flex-col gap-3 w-full max-w-[280px]">
                  <ButtonV2 onClick={goNext} size="large" class="w-full">
                    {language.t("onboarding.action.getStarted")}
                  </ButtonV2>
                </div>
              </div>
            </Match>

            <Match when={step() === "connectProvider"}>
              <div class="flex flex-col gap-4 pt-2">
                <div class="flex items-center gap-3">
                  <div class="flex size-8 items-center justify-center rounded-[8px] bg-v2-background-bg-layer-03">
                    <IconV2 name="providers" class="text-v2-icon-icon-base" />
                  </div>
                  <div>
                    <h3 class="text-[14px] leading-5 tracking-[-0.06px] text-v2-text-text-base [font-weight:600]">
                      {language.t("onboarding.step.connectProvider.title")}
                    </h3>
                  </div>
                </div>
                <p class="text-[13px] leading-[18px] tracking-[-0.04px] text-v2-text-text-muted [font-weight:440]">
                  {language.t("onboarding.step.connectProvider.description")}
                </p>
                <div class="flex flex-col gap-3 mt-2">
                  <ButtonV2 onClick={handleConnectProvider} size="large" class="w-full">
                    <IconV2 name="providers" />
                    {language.t("command.provider.connect")}
                  </ButtonV2>
                  <Show when={hasConnectedProviders()}>
                    <div class="flex items-center gap-2 text-[12px] text-v2-text-text-success [font-weight:530]">
                      <IconV2 name="close" class="size-4" />
                      Provider connected
                    </div>
                  </Show>
                </div>
              </div>
            </Match>

            <Match when={step() === "openProject"}>
              <div class="flex flex-col gap-4 pt-2">
                <div class="flex items-center gap-3">
                  <div class="flex size-8 items-center justify-center rounded-[8px] bg-v2-background-bg-layer-03">
                    <IconV2 name="folder-add-left" class="text-v2-icon-icon-base" />
                  </div>
                  <div>
                    <h3 class="text-[14px] leading-5 tracking-[-0.06px] text-v2-text-text-base [font-weight:600]">
                      {language.t("onboarding.step.openProject.title")}
                    </h3>
                  </div>
                </div>
                <p class="text-[13px] leading-[18px] tracking-[-0.04px] text-v2-text-text-muted [font-weight:440]">
                  {language.t("onboarding.step.openProject.description")}
                </p>
                <div class="flex flex-col gap-3 mt-2">
                  <ButtonV2 onClick={handleOpenProject} size="large" class="w-full">
                    <IconV2 name="folder-add-left" />
                    {language.t("command.project.open")}
                  </ButtonV2>
                  <Show when={hasProjects()}>
                    <div class="flex items-center gap-2 text-[12px] text-v2-text-text-success [font-weight:530]">
                      <IconV2 name="close" class="size-4" />
                      Project opened
                    </div>
                  </Show>
                </div>
              </div>
            </Match>

            <Match when={step() === "firstPrompt"}>
              <div class="flex flex-col gap-4 pt-2">
                <div class="flex items-center gap-3">
                  <div class="flex size-8 items-center justify-center rounded-[8px] bg-v2-background-bg-layer-03">
                    <IconV2 name="edit" class="text-v2-icon-icon-base" />
                  </div>
                  <div>
                    <h3 class="text-[14px] leading-5 tracking-[-0.06px] text-v2-text-text-base [font-weight:600]">
                      {language.t("onboarding.step.firstPrompt.title")}
                    </h3>
                  </div>
                </div>
                <p class="text-[13px] leading-[18px] tracking-[-0.04px] text-v2-text-text-muted [font-weight:440]">
                  {language.t("onboarding.step.firstPrompt.description")}
                </p>
                <div class="flex flex-col gap-2 mt-2 rounded-[8px] bg-v2-background-bg-layer-03 p-3">
                  <p class="text-[12px] leading-[16px] text-v2-text-text-muted [font-weight:440]">
                    Try asking something like:
                  </p>
                  <ul class="flex flex-col gap-1.5">
                    <li class="text-[13px] leading-[18px] text-v2-text-text-base [font-weight:440]">
                      "What is the tech stack of this project?"
                    </li>
                    <li class="text-[13px] leading-[18px] text-v2-text-text-base [font-weight:440]">
                      "Explain how authentication works"
                    </li>
                    <li class="text-[13px] leading-[18px] text-v2-text-text-base [font-weight:440]">
                      "Find and fix security vulnerabilities"
                    </li>
                  </ul>
                </div>
                <ButtonV2 onClick={handleFirstPrompt} size="large" class="w-full">
                  <IconV2 name="edit" />
                  Start a session
                </ButtonV2>
              </div>
            </Match>

            <Match when={step() === "complete"}>
              <div class="flex flex-col items-center gap-4 pt-4">
                <div class="flex size-14 items-center justify-center rounded-full bg-v2-background-bg-layer-03">
                  <IconV2 name="close" class="size-8 text-v2-text-text-success" />
                </div>
                <div class="flex flex-col items-center gap-2 text-center">
                  <h2 class="text-[18px] leading-6 tracking-[-0.18px] text-v2-text-text-base [font-weight:600]">
                    {language.t("onboarding.step.complete.title")}
                  </h2>
                  <p class="text-[13px] leading-[18px] tracking-[-0.04px] text-v2-text-text-muted [font-weight:440] max-w-[320px]">
                    {language.t("onboarding.step.complete.description")}
                  </p>
                </div>
                <div class="mt-2 flex flex-col gap-3 w-full max-w-[280px]">
                  <ButtonV2 onClick={handleDone} size="large" class="w-full">
                    {language.t("onboarding.action.done")}
                  </ButtonV2>
                </div>
              </div>
            </Match>
          </Switch>
        </div>

        {/* Footer Navigation */}
        <div class="flex items-center justify-between px-2.5 pt-2 border-t border-v2-border-border-base">
          <div class="text-[11px] leading-none tracking-[-0.01px] text-v2-text-text-faint [font-weight:530]">
            {language.t("onboarding.stepIndicator", { current: stepIndex() + 1, total })}
          </div>
          <div class="flex items-center gap-2">
            <Show when={!isFirst()}>
              <ButtonV2 variant="ghost-muted" size="small" onClick={goBack}>
                {language.t("onboarding.action.back")}
              </ButtonV2>
            </Show>
            <Show when={!isLast()}>
              <ButtonV2 variant="neutral" size="small" onClick={goNext}>
                {language.t("onboarding.action.next")}
              </ButtonV2>
            </Show>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

function createServerCtx(conn: any, scope: any) {
  return {
    projects: {
      open: (directory: string) => {
        try {
          localStorage.setItem(`opencode.project.${scope}:${directory}`, "true")
        } catch {}
      },
      touch: (directory: string) => {
        try {
          localStorage.setItem(`opencode.project.touch.${scope}:${directory}`, String(Date.now()))
        } catch {}
      },
    },
  }
}