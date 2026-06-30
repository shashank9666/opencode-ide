import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Icon } from "@opencode-ai/ui/v2/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import { createMemo, createResource, For, Match, Show, Switch } from "solid-js"
import { useLanguage } from "@/context/language"
import { useServerSDK } from "@/context/server-sdk"
import { useServerSync } from "@/context/server-sync"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { showToast } from "@/utils/toast"

type DetectedProvider = {
  id: string
  name: string
  baseURL: string
  icon: string
  models: string[]
  status: "detected" | "connecting" | "connected" | "failed"
}

async function detectLocalProviders(): Promise<DetectedProvider[]> {
  const results: DetectedProvider[] = []

  // Detect Ollama (default port 11434)
  try {
    const ollamaRes = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(3000) })
    if (ollamaRes.ok) {
      const data = await ollamaRes.json()
      const models: string[] = (data.models ?? []).map((m: any) => m.name)
      results.push({
        id: "ollama",
        name: "Ollama",
        baseURL: "http://localhost:11434/v1",
        icon: "ollama",
        models: models.length > 0 ? models : ["llama3", "mistral"],
        status: "detected",
      })
    }
  } catch {}

  // Detect LM Studio (default port 1234)
  try {
    const lmRes = await fetch("http://localhost:1234/v1/models", { signal: AbortSignal.timeout(2000) })
    if (lmRes.ok) {
      const data = await lmRes.json()
      const models: string[] = (data.data ?? []).map((m: any) => m.id)
      results.push({
        id: "lm-studio",
        name: "LM Studio",
        baseURL: "http://localhost:1234/v1",
        icon: "synthetic",
        models: models.length > 0 ? models : ["local-model"],
        status: "detected",
      })
    }
  } catch {}

  return results
}

export function DialogDetectLocalProviders() {
  const language = useLanguage()
  const dialog = useDialog()
  const serverSDK = useServerSDK()
  const serverSync = useServerSync()

  const [providers] = createResource(detectLocalProviders)

  async function addProvider(provider: DetectedProvider) {
    provider.status = "connecting"

    const config = {
      npm: "@ai-sdk/openai-compatible",
      name: provider.name,
      options: {
        baseURL: provider.baseURL,
      },
      models: Object.fromEntries(
        provider.models.map((model) => [
          model,
          {
            name: model,
            tool_call: true,
            limit: { context: 8192, output: 2048 },
          },
        ]),
      ),
    }

    try {
      await serverSync().updateConfig({
        provider: { [provider.id]: config },
        disabled_providers: (serverSync().data.config.disabled_providers ?? []).filter(
          (id: string) => id !== provider.id,
        ),
      })
      provider.status = "connected"
      showToast({
        variant: "success",
        icon: "circle-check",
        title: `${provider.name} connected`,
        description: `${provider.models.length} model(s) available`,
      })
    } catch {
      provider.status = "failed"
    }
  }

  function handleDone() {
    dialog.close()
  }

  const detected = createMemo(() => providers())
  const hasProviders = createMemo(() => (detected()?.length ?? 0) > 0)

  return (
    <Dialog transition>
      <div class="flex flex-col gap-6 px-2.5 pb-3">
        <div class="px-2.5 flex flex-col gap-4 pt-2">
          <h2 class="text-[16px] leading-5 tracking-[-0.12px] text-v2-text-text-base [font-weight:600]">
            Local AI Providers
          </h2>
          <p class="text-[13px] leading-[18px] tracking-[-0.04px] text-v2-text-text-muted [font-weight:440]">
            Detecting local AI providers running on your machine...
          </p>
        </div>

        <div class="px-2.5 flex flex-col gap-3 min-h-[120px]">
          <Show
            when={!providers.loading}
            fallback={
              <div class="flex items-center gap-3 px-3 py-4">
                <Spinner class="size-4" />
                <span class="text-[13px] text-v2-text-text-muted [font-weight:440]">Scanning localhost...</span>
              </div>
            }
          >
            <Show
              when={hasProviders()}
              fallback={
                <div class="flex flex-col items-center gap-3 py-6 text-center">
                  <Icon name="close" class="size-8 text-v2-text-text-faint" />
                  <p class="text-[13px] text-v2-text-text-muted [font-weight:440]">
                    No local AI providers detected. Make sure Ollama or LM Studio is running.
                  </p>
                </div>
              }
            >
              <For each={detected()}>
                {(provider) => (
                  <div class="flex items-center justify-between rounded-[8px] bg-v2-background-bg-layer-03 px-3 py-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-v2-background-bg-layer-02">
                        <Icon
                          name={provider.icon === "ollama" ? "edit" : "settings-gear"}
                          class="size-4 text-v2-icon-icon-base"
                        />
                      </div>
                      <div class="min-w-0">
                        <div class="text-[13px] leading-[18px] text-v2-text-text-base [font-weight:530] truncate">
                          {provider.name}
                        </div>
                        <div class="text-[11px] leading-[14px] text-v2-text-text-faint [font-weight:440] truncate">
                          {provider.baseURL} · {provider.models.length} model{provider.models.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <Switch>
                      <Match when={provider.status === "connected"}>
                        <div class="flex items-center gap-1.5 text-[12px] text-v2-text-text-success [font-weight:530]">
                          <Icon name="close" class="size-3" />
                          Connected
                        </div>
                      </Match>
                      <Match when={provider.status === "connecting"}>
                        <Spinner class="size-4" />
                      </Match>
                      <Match when={provider.status === "failed"}>
                        <div class="flex items-center gap-1.5 text-[12px] text-v2-text-text-critical [font-weight:530]">
                          Failed
                        </div>
                      </Match>
                      <Match when={true}>
                        <ButtonV2 size="small" variant="neutral" onClick={() => addProvider(provider)}>
                          Connect
                        </ButtonV2>
                      </Match>
                    </Switch>
                  </div>
                )}
              </For>
            </Show>
          </Show>
        </div>

        <div class="flex justify-end px-2.5 pt-2 border-t border-v2-border-border-base">
          <ButtonV2 onClick={handleDone} size="small" variant="neutral">
            {language.t("common.close")}
          </ButtonV2>
        </div>
      </div>
    </Dialog>
  )
}