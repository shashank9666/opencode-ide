import { Component, For, Show, createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Switch } from "@opencode-ai/ui/v2/switch-v2"
import { TextInputV2 } from "@opencode-ai/ui/v2/text-input-v2"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { IconButtonV2 } from "@opencode-ai/ui/v2/icon-button-v2"
import { useLanguage } from "@/context/language"
import { useServerSync } from "@/context/server-sync"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"
import "./settings-v2.css"

export const SettingsFormattersV2: Component = () => {
  const language = useLanguage()
  const serverSync = useServerSync()

  const formattersEnabled = createMemo(() => {
    const v = serverSync().data.config.formatter
    return v !== false && v !== undefined
  })

  const formattersMap = createMemo(() => {
    const v = serverSync().data.config.formatter
    if (typeof v === "object" && v !== null) return v as Record<string, { disabled?: boolean; command?: string[]; extensions?: string[] }>
    return {} as Record<string, { disabled?: boolean; command?: string[]; extensions?: string[] }>
  })

  const [newFormatter, setNewFormatter] = createStore({ name: "", command: "", extensions: "" })

  const setFormattersEnabled = async (checked: boolean) => {
    if (checked) {
      const current = serverSync().data.config.formatter
      if (current === false || current === undefined) {
        await serverSync().updateConfig({ formatter: true })
      }
    } else {
      await serverSync().updateConfig({ formatter: false })
    }
  }

  const addFormatter = async () => {
    if (!newFormatter.name.trim()) return
    const map = formattersMap()
    const commandArr = newFormatter.command.trim() ? newFormatter.command.trim().split(/\s+/) : undefined
    const extensionsArr = newFormatter.extensions.trim() ? newFormatter.extensions.trim().split(/,\s*/) : undefined

    map[newFormatter.name.trim()] = {
      command: commandArr,
      extensions: extensionsArr,
    }

    await serverSync().updateConfig({ formatter: { ...map } })
    setNewFormatter({ name: "", command: "", extensions: "" })
  }

  const removeFormatter = async (name: string) => {
    const map = { ...formattersMap() }
    delete map[name]
    const remaining = Object.keys(map)
    await serverSync().updateConfig({ formatter: remaining.length > 0 ? { ...map } : true })
  }

  const toggleFormatter = async (name: string, disabled: boolean) => {
    const map = { ...formattersMap() }
    map[name] = { ...(map[name] ?? {}), disabled }
    await serverSync().updateConfig({ formatter: { ...map } })
  }

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">Formatters</h2>
        <p class="settings-v2-tab-description">
          Configure code formatters used by the agent. Disable specific formatters or add custom ones.
        </p>
      </div>

      <div class="settings-v2-tab-body">
        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">Status</h3>
          <SettingsListV2>
            <SettingsRowV2
              title="Enable formatters"
              description="Enable or disable all code formatting"
            >
              <Switch checked={formattersEnabled()} onChange={setFormattersEnabled} />
            </SettingsRowV2>
          </SettingsListV2>
        </div>

        <Show when={formattersEnabled()}>
          <div class="settings-v2-section">
            <h3 class="settings-v2-section-title">Custom Formatter</h3>
            <div class="flex flex-col gap-3 p-4 rounded-lg bg-v2-background-bg-layer-01 border border-v2-border-border-muted">
              <TextInputV2
                type="text"
                appearance="base"
                value={newFormatter.name}
                onInput={(e) => setNewFormatter("name", e.currentTarget.value)}
                placeholder="Formatter name (e.g., 'prettier')"
              />
              <TextInputV2
                type="text"
                appearance="base"
                value={newFormatter.command}
                onInput={(e) => setNewFormatter("command", e.currentTarget.value)}
                placeholder="Command (e.g., 'npx prettier --write')"
              />
              <TextInputV2
                type="text"
                appearance="base"
                value={newFormatter.extensions}
                onInput={(e) => setNewFormatter("extensions", e.currentTarget.value)}
                placeholder="File extensions (comma-separated, e.g., .js,.ts,.jsx)"
              />
              <div>
                <ButtonV2 variant="ghost-muted" icon="plus" onClick={addFormatter}>
                  Add
                </ButtonV2>
              </div>
            </div>
          </div>

          <div class="settings-v2-section">
            <h3 class="settings-v2-section-title">Configured Formatters</h3>
            <Show
              when={Object.keys(formattersMap()).length > 0}
              fallback={
                <div class="flex items-center justify-center py-12 text-13-regular text-text-muted">
                  No custom formatters configured. Built-in formatters are active.
                </div>
              }
            >
              <SettingsListV2>
                <For each={Object.entries(formattersMap())}>
                  {([name, cfg]) => (
                    <div class="flex items-center justify-between py-3">
                      <div class="flex flex-col min-w-0 flex-1 gap-1">
                        <div class="flex items-center gap-2">
                          <span class="text-13-medium text-text-base">{name}</span>
                          <Show when={cfg.disabled}>
                            <span class="text-11-regular text-text-weaker">Disabled</span>
                          </Show>
                        </div>
                        <Show when={cfg.command}>
                          <span class="text-11-regular text-text-muted font-mono truncate">{cfg.command?.join(" ")}</span>
                        </Show>
                        <Show when={cfg.extensions}>
                          <span class="text-11-regular text-text-muted">{cfg.extensions?.join(", ")}</span>
                        </Show>
                      </div>
                      <div class="flex items-center gap-2">
                        <Switch
                          checked={!cfg.disabled}
                          onChange={(v) => toggleFormatter(name, !v)}
                        />
                        <IconButtonV2
                          icon={<IconV2 name="close" size="small" />}
                          variant="ghost-muted"
                          size="small"
                          onClick={() => removeFormatter(name)}
                        />
                      </div>
                    </div>
                  )}
                </For>
              </SettingsListV2>
            </Show>
          </div>
        </Show>
      </div>
    </>
  )
}
