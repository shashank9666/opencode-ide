import { Component, For, Show, createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { TextInputV2 } from "@opencode-ai/ui/v2/text-input-v2"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { SelectV2 } from "@opencode-ai/ui/v2/select-v2"
import { useLanguage } from "@/context/language"
import { useServerSync } from "@/context/server-sync"
import { SettingsListV2 } from "./parts/list"
import "./settings-v2.css"

type ReferenceType = "local" | "git" | "url"

const REFERENCE_TYPE_OPTIONS: { value: ReferenceType; label: string }[] = [
  { value: "local", label: "Local directory" },
  { value: "git", label: "Git repository" },
  { value: "url", label: "URL" },
]

export const SettingsReferencesV2: Component = () => {
  const language = useLanguage()
  const serverSync = useServerSync()

  const references = createMemo(() => {
    const refs = serverSync().data.config.references ?? serverSync().data.config.reference ?? {}
    return Object.entries(refs).map(([name, cfg]) => ({
      name,
      config: typeof cfg === "string" ? cfg : cfg,
      type: (typeof cfg === "string" ? "url" : "git" in (cfg ?? {}) ? "git" : "local") as ReferenceType,
    }))
  })

  const [newRef, setNewRef] = createStore({ name: "", type: "url" as ReferenceType, value: "" })

  const addReference = async () => {
    if (!newRef.name.trim() || !newRef.value.trim()) return
    const refs = { ...(serverSync().data.config.references ?? {}) }

    if (newRef.type === "git") {
      refs[newRef.name.trim()] = { git: newRef.value.trim() }
    } else if (newRef.type === "local") {
      refs[newRef.name.trim()] = { local: newRef.value.trim() }
    } else {
      refs[newRef.name.trim()] = newRef.value.trim()
    }

    await serverSync().updateConfig({ references: refs })
    setNewRef({ name: "", type: "url", value: "" })
  }

  const removeReference = async (name: string) => {
    const refs = { ...(serverSync().data.config.references ?? {}) }
    delete refs[name]
    await serverSync().updateConfig({ references: refs })
  }

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">References</h2>
        <p class="settings-v2-tab-description">
          Manage references that provide context to the agent, including local directories, git repositories, and URLs.
        </p>
      </div>

      <div class="settings-v2-tab-body">
        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">Add Reference</h3>
          <div class="flex flex-col gap-3 p-4 rounded-lg bg-v2-background-bg-layer-01 border border-v2-border-border-muted">
            <TextInputV2
              type="text"
              appearance="base"
              value={newRef.name}
              onInput={(e) => setNewRef("name", e.currentTarget.value)}
              placeholder="Reference name (e.g., 'docs')"
            />
            <SelectV2
              appearance="inline"
              options={REFERENCE_TYPE_OPTIONS}
              current={REFERENCE_TYPE_OPTIONS.find((o) => o.value === newRef.type)}
              value={(o) => o.value}
              label={(o) => o.label}
              onSelect={(option) => option && setNewRef("type", option.value as ReferenceType)}
            />
            <TextInputV2
              type="text"
              appearance="base"
              value={newRef.value}
              onInput={(e) => setNewRef("value", e.currentTarget.value)}
              placeholder={
                newRef.type === "git"
                  ? "https://github.com/user/repo.git"
                  : newRef.type === "local"
                    ? "./path/to/directory"
                    : "https://example.com/docs"
              }
            />
            <div>
              <ButtonV2 variant="ghost-muted" icon="plus" onClick={addReference}>
                Add
              </ButtonV2>
            </div>
          </div>
        </div>

        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">Configured References</h3>
          <Show
            when={references().length > 0}
            fallback={
              <div class="flex items-center justify-center py-12 text-13-regular text-text-muted">
                No references configured.
              </div>
            }
          >
            <SettingsListV2>
              <For each={references()}>
                {(ref) => (
                  <div class="flex items-center justify-between py-3">
                    <div class="flex flex-col min-w-0 flex-1 gap-1">
                      <div class="flex items-center gap-2">
                        <span class="text-13-medium text-text-base">{ref.name}</span>
                        <span class="text-11-regular text-text-weaker capitalize">{ref.type}</span>
                      </div>
                      <span class="text-11-regular text-text-muted truncate">
                        {typeof ref.config === "string"
                          ? ref.config
                          : "git" in ref.config
                            ? (ref.config as { git: string }).git
                            : (ref.config as { local: string }).local}
                      </span>
                    </div>
                    <IconButtonV2
                      icon={<IconV2 name="close" size="small" />}
                      variant="ghost-muted"
                      size="small"
                      onClick={() => removeReference(ref.name)}
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
