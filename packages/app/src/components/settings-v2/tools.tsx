import { Component, For, createMemo } from "solid-js"
import { useLanguage } from "@/context/language"
import { useServerSync } from "@/context/server-sync"
import { SelectV2 } from "@opencode-ai/ui/v2/select-v2"
import { Switch } from "@opencode-ai/ui/v2/switch-v2"
import { SettingsListV2 } from "./parts/list"
import { SettingsRowV2 } from "./parts/row"

const KNOWN_TOOLS = [
  "bash",
  "edit",
  "read",
  "grep",
  "glob",
  "apply_patch",
  "webfetch",
  "websearch",
  "todowrite",
  "skill",
  "question",
  "lsp",
]

export const SettingsToolsV2: Component = () => {
  const language = useLanguage()
  const serverSync = useServerSync()

  const allTools = createMemo(() => {
    const config = serverSync().data.config
    const toolsMap = config.tools ?? {}
    const permMap = typeof config.permission === "string" ? {} : (config.permission ?? {})

    const set = new Set([...KNOWN_TOOLS, ...Object.keys(toolsMap), ...Object.keys(permMap)])
    return Array.from(set).sort()
  })

  const permissionOptions = [
    { value: "allow", label: "Allow" },
    { value: "ask", label: "Ask" },
    { value: "deny", label: "Deny" },
    { value: "default", label: "Default" },
  ]

  const updateToolEnabled = async (toolName: string, enabled: boolean) => {
    const tools = { ...(serverSync().data.config.tools ?? {}) }
    if (enabled) {
      delete tools[toolName] // Reset to default (which is usually enabled for built-ins)
    } else {
      tools[toolName] = false
    }
    await serverSync().updateConfig({ tools })
  }

  const updateToolPermission = async (toolName: string, perm: string) => {
    let currentPerms = serverSync().data.config.permission
    if (typeof currentPerms === "string") {
      currentPerms = { "*": currentPerms } as any
    }
    const permission: Record<string, any> = { ...(currentPerms as any ?? {}) }
    if (perm === "default") {
      delete permission[toolName]
    } else {
      permission[toolName] = perm
    }
    await serverSync().updateConfig({ permission: permission as any })
  }

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">Tools</h2>
        <p class="settings-v2-tab-description">
          Manage built-in and custom tools available to the agent.
        </p>
      </div>

      <div class="settings-v2-tab-body">
        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">Permissions & Status</h3>
          <SettingsListV2>
            <For each={allTools()}>
              {(toolName) => {
                const isEnabled = () => serverSync().data.config.tools?.[toolName] !== false
                const currentPerm = () => {
                  const p = serverSync().data.config.permission
                  if (typeof p === "string") return p
                  return (p as any)?.[toolName] ?? "default"
                }

                return (
                  <SettingsRowV2
                    title={toolName}
                    description={`Configure permissions and status for the ${toolName} tool.`}
                  >
                    <div class="flex items-center gap-4">
                      <SelectV2
                        appearance="inline"
                        options={permissionOptions}
                        current={permissionOptions.find((o) => o.value === currentPerm())}
                        placement="bottom-end"
                        gutter={6}
                        value={(o) => o.value}
                        label={(o) => o.label}
                        onSelect={(option) => {
                          if (option) void updateToolPermission(toolName, option.value)
                        }}
                      />
                      <div class="flex items-center gap-2">
                        <span class="text-12-regular text-text-weak">{isEnabled() ? "Enabled" : "Disabled"}</span>
                        <Switch
                          checked={isEnabled()}
                          onChange={(checked) => void updateToolEnabled(toolName, checked)}
                        />
                      </div>
                    </div>
                  </SettingsRowV2>
                )
              }}
            </For>
          </SettingsListV2>
        </div>
      </div>
    </>
  )
}
