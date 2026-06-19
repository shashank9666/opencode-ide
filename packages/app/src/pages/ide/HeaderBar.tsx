import { createSignal, For, Show, type JSX } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Tooltip } from "@opencode-ai/ui/tooltip"
import { MENUS } from "./MenuBar"

export default function HeaderBar(props: {
  workspaceName?: string
  activeFile?: string
  onSearch: () => void
  onCommandPalette: () => void
  onToggleLeftPanel?: () => void
  onToggleBottomPanel?: () => void
  onToggleRightPanel?: () => void
}) {
  const [activeMenu, setActiveMenu] = createSignal<string | null>(null)

  const handleMenuClick = (menuLabel: string) => {
    if (activeMenu() === menuLabel) setActiveMenu(null)
    else setActiveMenu(menuLabel)
  }

  const handleMouseLeave = () => setActiveMenu(null)

  return (
    <div
      class="shrink-0 flex items-center justify-between px-2 border-b border-border-base bg-[#181818] select-none [app-region:drag] z-30 text-text-weaker relative"
      style={{ height: "35px" }}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Left: Logo & Menus ── */}
      <div class="flex items-center h-full [app-region:no-drag]">
        {/* Logo */}
        <div class="flex items-center justify-center px-3 h-full cursor-pointer hover:bg-surface-raised-base-hover transition-colors">
          <Icon name="code" size="large" class="text-accent-base" />
        </div>

        {/* Menus */}
        <div class="flex items-center h-full">
          <For each={MENUS}>{(menu) => (
            <div class="relative h-full">
              <button
                type="button"
                class="px-2.5 h-full text-13-regular hover:bg-surface-raised-base-hover hover:text-text-strong transition-colors cursor-default"
                classList={{ "bg-surface-raised-base text-text-strong": activeMenu() === menu.label }}
                onClick={() => handleMenuClick(menu.label)}
                onMouseEnter={() => { if (activeMenu()) setActiveMenu(menu.label) }}
              >
                {menu.label}
              </button>
              <Show when={activeMenu() === menu.label && menu.submenu}>
                <div class="absolute top-full left-0 mt-0 min-w-52 bg-surface-raised-base border border-border-base rounded-md shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <For each={menu.submenu}>{(item) => (
                    <>
                      <Show when={item.separator}>
                        <div class="h-px my-1 bg-border-base" />
                      </Show>
                      <Show when={!item.separator}>
                        <button
                          type="button"
                          class="w-full flex items-center justify-between px-6 py-1.5 text-13-regular text-text-weak hover:bg-accent-base hover:text-white transition-colors cursor-default"
                          disabled={item.disabled}
                          classList={{ "opacity-50 cursor-not-allowed": item.disabled }}
                          onClick={() => { if (item.action) item.action(); setActiveMenu(null) }}
                        >
                          <span>{item.label}</span>
                          <Show when={item.shortcut}>
                            <span class="text-11-regular ml-6 opacity-70">{item.shortcut}</span>
                          </Show>
                        </button>
                      </Show>
                    </>
                  )}</For>
                </div>
              </Show>
            </div>
          )}</For>
          {/* Ellipsis for extra menus */}
          <button class="px-2.5 h-full flex items-center justify-center hover:bg-surface-raised-base-hover transition-colors">
            <Icon name="menu" size="small" />
          </button>
        </div>
      </div>

      {/* ── Center: Title ── */}
      <div class="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 flex items-center justify-center pointer-events-none">
        <span class="text-12-regular text-text-weaker truncate px-4">
          {props.workspaceName ?? "Untitled"} Opencode-web
          <Show when={props.activeFile}>
            {" - " + props.activeFile}
          </Show>
        </span>
      </div>

      {/* ── Right: Layout, Search, Settings ── */}
      <div class="flex items-center h-full [app-region:no-drag]">
        {/* Panel Toggles */}
        <div class="flex items-center h-full px-1">
          <Tooltip value="Toggle Primary Side Bar" placement="bottom">
            <IconButton
              icon="layout-left"
              variant="ghost"
              size="small"
              class="size-6 text-icon-weak hover:text-text-strong rounded-[4px]"
              onClick={props.onToggleLeftPanel}
            />
          </Tooltip>
          <Tooltip value="Toggle Bottom Panel" placement="bottom">
            <IconButton
              icon="layout-bottom"
              variant="ghost"
              size="small"
              class="size-6 text-icon-weak hover:text-text-strong rounded-[4px]"
              onClick={props.onToggleBottomPanel}
            />
          </Tooltip>
          <Tooltip value="Toggle Secondary Side Bar" placement="bottom">
            <IconButton
              icon="layout-right"
              variant="ghost"
              size="small"
              class="size-6 text-icon-weak hover:text-text-strong rounded-[4px]"
              onClick={props.onToggleRightPanel}
            />
          </Tooltip>
          <Tooltip value="Customize Layout" placement="bottom">
            <IconButton
              icon="layout-left-partial"
              variant="ghost"
              size="small"
              class="size-6 text-icon-weak hover:text-text-strong rounded-[4px]"
            />
          </Tooltip>
        </div>

        <div class="h-4 w-px bg-border-base mx-1" />

        {/* Global Search */}
        <Tooltip value="Search (Ctrl+Shift+F)" placement="bottom">
          <IconButton
            icon="magnifying-glass"
            variant="ghost"
            size="small"
            class="size-6 text-icon-weak hover:text-text-strong rounded-[4px]"
            onClick={props.onSearch}
          />
        </Tooltip>

        <div class="h-4 w-px bg-border-base mx-1" />

        {/* Extensions / Settings */}
        <Tooltip value="Manage Extension" placement="bottom">
          <IconButton
            icon="providers"
            variant="ghost"
            size="small"
            class="size-6 text-icon-weak hover:text-text-strong rounded-[4px]"
          />
        </Tooltip>
        <Tooltip value="Account" placement="bottom">
          <IconButton
            icon="github"
            variant="ghost"
            size="small"
            class="size-6 text-icon-weak hover:text-text-strong rounded-[4px]"
          />
        </Tooltip>
        <Tooltip value="Manage" placement="bottom">
          <IconButton
            icon="settings-gear"
            variant="ghost"
            size="small"
            class="size-6 text-icon-weak hover:text-text-strong rounded-[4px]"
          />
        </Tooltip>

        {/* Window Controls (Native Desktop Emulation) */}
        <div class="flex items-center h-full ml-1">
          <IconButton
            icon="dash"
            variant="ghost"
            size="small"
            class="size-11 text-icon-weak hover:bg-surface-raised-base hover:text-text-strong rounded-none"
          />
          <IconButton
            icon="expand"
            variant="ghost"
            size="small"
            class="size-11 text-icon-weak hover:bg-surface-raised-base hover:text-text-strong rounded-none"
          />
          <IconButton
            icon="close"
            variant="ghost"
            size="small"
            class="size-11 text-icon-weak hover:bg-text-danger-base hover:text-white rounded-none"
          />
        </div>
      </div>
    </div>
  )
}
