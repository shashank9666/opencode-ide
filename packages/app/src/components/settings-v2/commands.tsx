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

type CommandEntry = {
  name: string
  template: string
  description?: string
  agent?: string
  model?: string
  variant?: string
  subtask?: boolean
}

export const SettingsCommandsV2: Component = () => {
  const language = useLanguage()
  const serverSync = useServerSync()

  const commands = createMemo(() => {
    const cmds = serverSync().data.config.command ?? {}
    return Object.entries(cmds).map(([name, cfg]) => ({
      name,
      template: cfg.template,
      description: cfg.description,
      agent: cfg.agent,
      model: cfg.model,
      variant: cfg.variant,
      subtask: cfg.subtask,
    }))
  })

  const [editing, setEditing] = createStore<Record<string, boolean>>({})
  const [newCmd, setNewCmd] = createStore<{
    name: string
    template: string
    description: string
    agent: string
    model: string
    variant: string
    subtask: boolean
  }>({ name: "", template: "", description: "", agent: "", model: "", variant: "", subtask: false })
  const [showNewForm, setShowNewForm] = createStore({ open: false })

  const toggleEditing = (name: string) => {
    setEditing(name, !editing[name])
  }

  const removeCommand = async (name: string) => {
    const cmds = { ...(serverSync().data.config.command ?? {}) }
    delete cmds[name]
    await serverSync().updateConfig({ command: cmds })
  }

  const saveCommand = async (originalName: string, entry: CommandEntry) => {
    const cmds = { ...(serverSync().data.config.command ?? {}) }

    if (originalName !== entry.name) {
      delete cmds[originalName]
    }

    cmds[entry.name] = {
      template: entry.template,
      ...(entry.description ? { description: entry.description } : {}),
      ...(entry.agent ? { agent: entry.agent } : {}),
      ...(entry.model ? { model: entry.model } : {}),
      ...(entry.variant ? { variant: entry.variant } : {}),
      ...(entry.subtask ? { subtask: true } : {}),
    }

    await serverSync().updateConfig({ command: cmds })
    setEditing(originalName, false)
  }

  const addCommand = async () => {
    if (!newCmd.name.trim() || !newCmd.template.trim()) return

    const cmds = { ...(serverSync().data.config.command ?? {}) }
    cmds[newCmd.name.trim()] = {
      template: newCmd.template.trim(),
      ...(newCmd.description.trim() ? { description: newCmd.description.trim() } : {}),
      ...(newCmd.agent.trim() ? { agent: newCmd.agent.trim() } : {}),
      ...(newCmd.model.trim() ? { model: newCmd.model.trim() } : {}),
      ...(newCmd.variant.trim() ? { variant: newCmd.variant.trim() } : {}),
      ...(newCmd.subtask ? { subtask: true } : {}),
    }

    await serverSync().updateConfig({ command: cmds })
    setNewCmd({ name: "", template: "", description: "", agent: "", model: "", variant: "", subtask: false })
    setShowNewForm("open", false)
  }

  const [editForms, setEditForms] = createStore<Record<string, CommandEntry>>({})

  const initEditForm = (name: string, entry: CommandEntry) => {
    if (!editForms[name]) {
      setEditForms(name, { ...entry })
    }
  }

  return (
    <>
      <div class="settings-v2-tab-header settings-v2-tab-header--stacked">
        <div class="settings-v2-tab-header-row">
          <h2 class="settings-v2-tab-title">Custom Commands</h2>
          <ButtonV2 variant="ghost-muted" icon="plus" onClick={() => setShowNewForm("open", true)}>
            Add Command
          </ButtonV2>
        </div>
      </div>

      <div class="settings-v2-tab-body">
        <Show when={showNewForm.open}>
          <div class="settings-v2-section">
            <h3 class="settings-v2-section-title">New Command</h3>
            <div class="flex flex-col gap-3 p-4 rounded-lg bg-v2-background-bg-layer-01 border border-v2-border-border-muted">
              <TextInputV2
                type="text"
                appearance="base"
                value={newCmd.name}
                onInput={(e) => setNewCmd("name", e.currentTarget.value)}
                placeholder="Command name (e.g., 'deploy')"
              />
              <TextInputV2
                type="text"
                appearance="base"
                value={newCmd.template}
                onInput={(e) => setNewCmd("template", e.currentTarget.value)}
                placeholder="Template (e.g., 'npm run deploy $ARGUMENTS')"
              />
              <TextInputV2
                type="text"
                appearance="base"
                value={newCmd.description}
                onInput={(e) => setNewCmd("description", e.currentTarget.value)}
                placeholder="Description (optional)"
              />
              <TextInputV2
                type="text"
                appearance="base"
                value={newCmd.agent}
                onInput={(e) => setNewCmd("agent", e.currentTarget.value)}
                placeholder="Agent override (optional)"
              />
              <TextInputV2
                type="text"
                appearance="base"
                value={newCmd.model}
                onInput={(e) => setNewCmd("model", e.currentTarget.value)}
                placeholder="Model override (optional, e.g. 'provider/model')"
              />
              <TextInputV2
                type="text"
                appearance="base"
                value={newCmd.variant}
                onInput={(e) => setNewCmd("variant", e.currentTarget.value)}
                placeholder="Variant (optional)"
              />
              <div class="flex items-center gap-2">
                <Switch checked={newCmd.subtask} onChange={(v) => setNewCmd("subtask", v)} />
                <span class="text-13-regular text-text-base">Subtask (run in background)</span>
              </div>
              <div class="flex items-center gap-2">
                <ButtonV2 variant="ghost-muted" icon="plus" onClick={addCommand}>
                  Create
                </ButtonV2>
                <ButtonV2 variant="ghost-muted" onClick={() => setShowNewForm("open", false)}>
                  Cancel
                </ButtonV2>
              </div>
            </div>
          </div>
        </Show>

        <Show
          when={commands().length > 0}
          fallback={
            <div class="flex items-center justify-center py-12 text-13-regular text-text-muted">
              No custom commands configured. Add one using the button above.
            </div>
          }
        >
          <div class="settings-v2-section">
            <h3 class="settings-v2-section-title">Commands</h3>
            <For each={commands()}>
              {(cmd) => {
                initEditForm(cmd.name, cmd)
                const form = () => editForms[cmd.name]
                return (
                  <div class="border border-v2-border-border-muted rounded-lg mb-3 overflow-hidden">
                    <div class="flex items-center justify-between p-3 bg-v2-background-bg-layer-01">
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="text-13-medium text-text-base font-mono">/{cmd.name}</span>
                        <Show when={cmd.description}>
                          <span class="text-11-regular text-text-muted truncate">{cmd.description}</span>
                        </Show>
                      </div>
                      <div class="flex items-center gap-1">
                        <IconButtonV2
                          icon={<IconV2 name="edit" size="small" />}
                          variant="ghost-muted"
                          size="small"
                          onClick={() => {
                            setEditForms(cmd.name, { ...cmd })
                            toggleEditing(cmd.name)
                          }}
                        />
                        <IconButtonV2
                          icon={<IconV2 name="close" size="small" />}
                          variant="ghost-muted"
                          size="small"
                          onClick={() => removeCommand(cmd.name)}
                        />
                      </div>
                    </div>

                    <Show when={editing[cmd.name]}>
                      <div class="flex flex-col gap-3 p-3 border-t border-v2-border-border-muted">
                        <TextInputV2
                          type="text"
                          appearance="base"
                          value={form()?.template ?? ""}
                          onInput={(e) => setEditForms(cmd.name, "template", e.currentTarget.value)}
                          placeholder="Template"
                        />
                        <TextInputV2
                          type="text"
                          appearance="base"
                          value={form()?.description ?? ""}
                          onInput={(e) => setEditForms(cmd.name, "description", e.currentTarget.value ?? undefined)}
                          placeholder="Description"
                        />
                        <TextInputV2
                          type="text"
                          appearance="base"
                          value={form()?.agent ?? ""}
                          onInput={(e) => setEditForms(cmd.name, "agent", e.currentTarget.value ?? undefined)}
                          placeholder="Agent"
                        />
                        <TextInputV2
                          type="text"
                          appearance="base"
                          value={form()?.model ?? ""}
                          onInput={(e) => setEditForms(cmd.name, "model", e.currentTarget.value ?? undefined)}
                          placeholder="Model"
                        />
                        <TextInputV2
                          type="text"
                          appearance="base"
                          value={form()?.variant ?? ""}
                          onInput={(e) => setEditForms(cmd.name, "variant", e.currentTarget.value ?? undefined)}
                          placeholder="Variant"
                        />
                        <div class="flex items-center gap-2">
                          <Switch checked={form()?.subtask ?? false} onChange={(v) => setEditForms(cmd.name, "subtask", v)} />
                          <span class="text-13-regular text-text-base">Subtask</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <ButtonV2 variant="ghost-muted" icon="check" onClick={() => form() && saveCommand(cmd.name, form() as CommandEntry)}>
                            Save
                          </ButtonV2>
                          <ButtonV2 variant="ghost-muted" onClick={() => setEditing(cmd.name, false)}>
                            Cancel
                          </ButtonV2>
                        </div>
                      </div>
                    </Show>

                    <Show when={!editing[cmd.name]}>
                      <div class="flex flex-wrap gap-x-4 gap-y-1 px-3 pb-3 text-11-regular text-text-muted">
                        <span>Template: <span class="font-mono text-text-base">{cmd.template}</span></span>
                        <Show when={cmd.agent}><span>Agent: {cmd.agent}</span></Show>
                        <Show when={cmd.model}><span>Model: {cmd.model}</span></Show>
                        <Show when={cmd.variant}><span>Variant: {cmd.variant}</span></Show>
                        <Show when={cmd.subtask}><span>Subtask</span></Show>
                      </div>
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </Show>
      </div>
    </>
  )
}
