import { Component, For, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { useServerSync } from "@/context/server-sync"
import { createStore } from "solid-js/store"
import { TextField } from "@opencode-ai/ui/text-field"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { Switch } from "@opencode-ai/ui/v2/switch-v2"
import { SettingsListV2 } from "./parts/list"

export const SettingsPluginsV2: Component = () => {
  const language = useLanguage()
  const serverSync = useServerSync()
  const [state, setState] = createStore({ newPlugin: "", pending: false })

  const plugins = () => serverSync().data.config.plugin ?? []
  const getPluginName = (p: string | [string, any]) => (typeof p === "string" ? p : p[0])

  const addPlugin = async () => {
    const p = state.newPlugin.trim()
    if (!p) return
    if (plugins().includes(p)) {
      setState("newPlugin", "")
      return
    }
    
    setState("pending", true)
    try {
      await serverSync().updateConfig({ plugin: [...plugins(), p] })
      setState("newPlugin", "")
    } finally {
      setState("pending", false)
    }
  }

  const removePlugin = async (p: string) => {
    setState("pending", true)
    try {
      await serverSync().updateConfig({ plugin: plugins().filter((x) => getPluginName(x) !== p) })
    } finally {
      setState("pending", false)
    }
  }

  const isPluginEnabled = (plugin: string | [string, any]) => {
    if (typeof plugin === "string") return true
    if (Array.isArray(plugin)) {
      const opts = plugin[1]
      if (opts) {
        if (opts.enabled === false) return false
        if (opts.disabled === true) return false
      }
    }
    return true
  }

  const togglePlugin = async (pluginName: string, checked: boolean) => {
    setState("pending", true)
    try {
      const nextPlugins = plugins().map((x) => {
        if (getPluginName(x) === pluginName) {
          if (typeof x === "string") {
            return [x, { enabled: checked }] as [string, any]
          }
          if (Array.isArray(x)) {
            const opts = { ...x[1], enabled: checked } as any
            delete opts.disabled
            return [x[0], opts] as [string, any]
          }
        }
        return x
      })
      await serverSync().updateConfig({ plugin: nextPlugins })
    } finally {
      setState("pending", false)
    }
  }

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">Plugins</h2>
        <p class="settings-v2-tab-description">
          Manage your OpenCode plugins to add new features and integrations.
        </p>
      </div>

      <div class="settings-v2-tab-body">
        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">Installed Plugins</h3>
          
          <SettingsListV2>
            <Show
              when={plugins().length > 0}
              fallback={
                <div class="settings-v2-provider-empty">No plugins installed</div>
              }
            >
               <For each={plugins()}>
                 {(plugin) => {
                   const pluginName = getPluginName(plugin)
                   return (
                     <div class="settings-v2-provider-row group">
                       <div class="settings-v2-provider-lead">
                         <div class="settings-v2-provider-main">
                           <span class="settings-v2-provider-name truncate">{pluginName}</span>
                         </div>
                       </div>
                       <div class="flex items-center gap-4">
                         <div class="flex items-center gap-2">
                           <span class="text-12-regular text-text-weak">{isPluginEnabled(plugin) ? "Enabled" : "Disabled"}</span>
                           <Switch
                             checked={isPluginEnabled(plugin)}
                             onChange={(checked) => void togglePlugin(pluginName, checked)}
                             disabled={state.pending}
                           />
                         </div>
                         <ButtonV2 
                           size="normal" 
                           variant="ghost-muted" 
                           onClick={() => void removePlugin(pluginName)}
                           disabled={state.pending}
                         >
                           Remove
                         </ButtonV2>
                       </div>
                     </div>
                   )
                 }}
               </For>
            </Show>
          </SettingsListV2>
        </div>

        <div class="settings-v2-section mt-4">
          <h3 class="settings-v2-section-title">Add Plugin</h3>
          <div class="flex gap-2 items-end">
            <div class="flex-1">
              <TextField
                placeholder="npm package name (e.g., opencode-helicone-session)"
                value={state.newPlugin}
                onChange={(v) => setState("newPlugin", v)}
                onKeyDown={(e: any) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    void addPlugin()
                  }
                }}
              />
            </div>
            <ButtonV2
              size="normal"
              variant="neutral"
              onClick={() => void addPlugin()}
              disabled={state.pending || !state.newPlugin.trim()}
            >
              Add
            </ButtonV2>
          </div>
        </div>
      </div>
    </>
  )
}
