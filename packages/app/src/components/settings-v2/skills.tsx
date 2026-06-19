import { Component, For, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { useServerSync } from "@/context/server-sync"
import { createStore } from "solid-js/store"
import { TextField } from "@opencode-ai/ui/text-field"
import { ButtonV2 } from "@opencode-ai/ui/v2/button-v2"
import { SettingsListV2 } from "./parts/list"
import { usePlatform } from "@/context/platform"

export const SettingsSkillsV2: Component = () => {
  const language = useLanguage()
  const serverSync = useServerSync()
  const [state, setState] = createStore({ newSkill: "", pending: false })

  const getSkillsArray = () => {
    const s = serverSync().data.config.skills
    if (!s) return []
    if (Array.isArray(s)) return s as string[]
    return [...(s.paths ?? []), ...(s.urls ?? [])]
  }

  const platform = usePlatform()

  const handleBrowse = async () => {
    if (platform.platform !== "desktop") return
    const path = await platform.openDirectoryPickerDialog({ title: "Select Skill Directory" })
    if (path) {
      const selected = Array.isArray(path) ? path[0] : path
      if (selected) {
        setState("newSkill", selected)
      }
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      const path = (files[0] as any).path
      if (path) {
        setState("newSkill", path)
      }
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const skills = () => getSkillsArray()

  const addSkill = async () => {
    const s = state.newSkill.trim()
    if (!s) return
    if (skills().includes(s)) {
      setState("newSkill", "")
      return
    }
    
    setState("pending", true)
    try {
      const isUrl = s.startsWith("http://") || s.startsWith("https://")
      const current = serverSync().data.config.skills
      const next: { paths?: string[], urls?: string[] } = Array.isArray(current) ? { paths: current as string[] } : { ...(current ?? {}) }
      
      if (isUrl) {
        next.urls = [...(next.urls ?? []), s]
      } else {
        next.paths = [...(next.paths ?? []), s]
      }
      
      await serverSync().updateConfig({ skills: next })
      setState("newSkill", "")
    } finally {
      setState("pending", false)
    }
  }

  const removeSkill = async (s: string) => {
    setState("pending", true)
    try {
      const current = serverSync().data.config.skills
      if (!current) return
      
      if (Array.isArray(current)) {
        await serverSync().updateConfig({ skills: current.filter((x) => x !== s) as any })
        return
      }

      const next = { ...current }
      if (next.paths) next.paths = next.paths.filter((x) => x !== s)
      if (next.urls) next.urls = next.urls.filter((x) => x !== s)
      
      await serverSync().updateConfig({ skills: next })
    } finally {
      setState("pending", false)
    }
  }

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">Skills</h2>
        <p class="settings-v2-tab-description">
          Manage skills and specialized knowledge paths/URLs available to the agent.
        </p>
      </div>

      <div class="settings-v2-tab-body">
        <div class="settings-v2-section">
          <h3 class="settings-v2-section-title">Configured Skills</h3>
          
          <SettingsListV2>
            <Show
              when={skills().length > 0}
              fallback={
                <div class="settings-v2-provider-empty">No skills found in config</div>
              }
            >
              <For each={skills()}>
                {(skillPath) => (
                  <div class="settings-v2-provider-row group">
                    <div class="settings-v2-provider-lead">
                      <div class="settings-v2-provider-main">
                        <span class="settings-v2-provider-name truncate">{skillPath}</span>
                      </div>
                    </div>
                    <ButtonV2 
                      size="normal" 
                      variant="ghost-muted" 
                      onClick={() => void removeSkill(skillPath)}
                      disabled={state.pending}
                    >
                      Remove
                    </ButtonV2>
                  </div>
                )}
              </For>
            </Show>
          </SettingsListV2>
        </div>

        <div class="settings-v2-section mt-4">
          <h3 class="settings-v2-section-title">Add Skill Location</h3>
          <div class="flex gap-2 items-end">
            <div 
              class="flex-1"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <TextField
                placeholder="Absolute path or URL to skill directory"
                value={state.newSkill}
                onChange={(v) => setState("newSkill", v)}
                onKeyDown={(e: any) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    void addSkill()
                  }
                }}
              />
            </div>
            <Show when={platform.platform === "desktop"}>
              <ButtonV2
                size="normal"
                variant="ghost-muted"
                onClick={() => void handleBrowse()}
              >
                Browse...
              </ButtonV2>
            </Show>
            <ButtonV2
              size="normal"
              variant="neutral"
              onClick={() => void addSkill()}
              disabled={state.pending || !state.newSkill.trim()}
            >
              Add
            </ButtonV2>
          </div>
        </div>
      </div>
    </>
  )
}
