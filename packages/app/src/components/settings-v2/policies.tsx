import { Component, For, Show, createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { TextInputV2 } from "@opencode-ai/ui/v2/text-input-v2"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { useLanguage } from "@/context/language"
import { useServerSync } from "@/context/server-sync"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import "./settings-v2.css"

type PolicyEntry = {
  name: string
  prompt?: string
  banned_commands?: string[]
  allowed_commands?: string[]
  banned_globs?: string[]
  allowed_globs?: string[]
  banned_models?: string[]
  max_tokens?: number
  [key: string]: unknown
}

export const SettingsPoliciesV2: Component = () => {
  const language = useLanguage()
  const serverSync = useServerSync()

  const policies = createMemo(() => {
    const exp = serverSync().data.config.experimental
    if (!exp?.policies) return [] as PolicyEntry[]
    return exp.policies as PolicyEntry[]
  })

  const [newPolicy, setNewPolicy] = createStore({ name: "", prompt: "" })

  const addPolicy = async () => {
    if (!newPolicy.name.trim()) return
    const current = policies()
    const entry: PolicyEntry = {
      name: newPolicy.name.trim(),
      ...(newPolicy.prompt.trim() ? { prompt: newPolicy.prompt.trim() } : {}),
    }
    const exp = { ...(serverSync().data.config.experimental ?? {}) }
    exp.policies = [...current, entry]
    await serverSync().updateConfig({ experimental: exp })
    setNewPolicy({ name: "", prompt: "" })
  }

  const removePolicy = async (index: number) => {
    const current = policies()
    const exp = { ...(serverSync().data.config.experimental ?? {}) }
    exp.policies = current.filter((_, i) => i !== index)
    await serverSync().updateConfig({ experimental: exp })
  }

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">Policies</h2>
        <p class="settings-v2-tab-description">
          Configure experimental policies that define constraints for agent behavior.
        </p>
      </div>

      <div class="settings-v2-tab-body">
        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">Add Policy</h3>
          <div class="flex flex-col gap-3 p-4 rounded-lg bg-v2-background-bg-layer-01 border border-v2-border-border-muted">
            <TextInputV2
              type="text"
              appearance="base"
              value={newPolicy.name}
              onInput={(e) => setNewPolicy("name", e.currentTarget.value)}
              placeholder="Policy name (e.g., 'no-prod-deploy')"
            />
            <TextInputV2
              type="text"
              appearance="base"
              value={newPolicy.prompt}
              onInput={(e) => setNewPolicy("prompt", e.currentTarget.value)}
              placeholder="Policy prompt (instructions for the agent)"
            />
            <div>
              <ButtonV2 variant="ghost-muted" icon="plus" onClick={addPolicy}>
                Add
              </ButtonV2>
            </div>
          </div>
        </div>

        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">Configured Policies</h3>
          <Show
            when={policies().length > 0}
            fallback={
              <div class="flex items-center justify-center py-12 text-13-regular text-text-muted">
                No policies configured.
              </div>
            }
          >
            <SettingsListV2>
              <For each={policies()}>
                {(policy, index) => (
                  <div class="flex items-center justify-between py-3">
                    <div class="flex flex-col min-w-0 flex-1 gap-1">
                      <div class="flex items-center gap-2">
                        <span class="text-13-medium text-text-base">{policy.name}</span>
                      </div>
                      <Show when={policy.prompt}>
                        <span class="text-11-regular text-text-muted truncate">{policy.prompt}</span>
                      </Show>
                    </div>
                    <IconButtonV2
                      icon={<IconV2 name="close" size="small" />}
                      variant="ghost-muted"
                      size="small"
                      onClick={() => removePolicy(index())}
                    />
                  </div>
                )}
              </For>
            </SettingsListV2>
          </Show>
        </div>
      </div>
    </>
  )
}
