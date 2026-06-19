import { createSignal, For, Show, type Component } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"

export type MenuItem = {
  label: string
  submenu?: SubmenuItem[]
  action?: () => void
}

export type SubmenuItem = {
  label?: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
  submenu?: SubmenuItem[]
  action?: () => void
}

const FILE_MENU: MenuItem = {
  label: "File",
  submenu: [
    { label: "New File", shortcut: "Ctrl+N", action: () => {} },
    { label: "New Window", shortcut: "Ctrl+Shift+N", action: () => {} },
    { separator: true },
    { label: "Open File...", shortcut: "Ctrl+O", action: () => {} },
    { label: "Open Folder...", shortcut: "Ctrl+K Ctrl+O", action: () => {} },
    { separator: true },
    { label: "Save", shortcut: "Ctrl+S", action: () => {} },
    { label: "Save As...", shortcut: "Ctrl+Shift+S", action: () => {} },
    { label: "Save All", shortcut: "Ctrl+K S", action: () => {} },
    { separator: true },
    { label: "Auto Save", submenu: [
      { label: "Off", action: () => {} },
      { label: "After Delay", action: () => {} },
      { label: "On Focus Change", action: () => {} },
    ]},
    { separator: true },
    { label: "Close Editor", shortcut: "Ctrl+F4", action: () => {} },
    { label: "Close Folder", action: () => {} },
    { label: "Close Window", shortcut: "Alt+F4", action: () => {} },
  ],
}

const EDIT_MENU: MenuItem = {
  label: "Edit",
  submenu: [
    { label: "Undo", shortcut: "Ctrl+Z", action: () => {} },
    { label: "Redo", shortcut: "Ctrl+Y", action: () => {} },
    { separator: true },
    { label: "Cut", shortcut: "Ctrl+X", action: () => {} },
    { label: "Copy", shortcut: "Ctrl+C", action: () => {} },
    { label: "Paste", shortcut: "Ctrl+V", action: () => {} },
    { separator: true },
    { label: "Find", shortcut: "Ctrl+F", action: () => {} },
    { label: "Replace", shortcut: "Ctrl+H", action: () => {} },
    { label: "Find in Files", shortcut: "Ctrl+Shift+F", action: () => {} },
    { separator: true },
    { label: "Toggle Line Comment", shortcut: "Ctrl+/", action: () => {} },
    { label: "Toggle Block Comment", shortcut: "Shift+Alt+A", action: () => {} },
    { separator: true },
    { label: "Format Document", shortcut: "Shift+Alt+F", action: () => {} },
    { label: "Format Selection", shortcut: "Ctrl+K Ctrl+F", action: () => {} },
  ],
}

const VIEW_MENU: MenuItem = {
  label: "View",
  submenu: [
    { label: "Explorer", shortcut: "Ctrl+Shift+E", action: () => {}, submenu: [
      { label: "Toggle Explorer", shortcut: "Ctrl+B", action: () => {} },
      { label: "Show Hidden Files", action: () => {} },
    ]},
    { label: "Search", shortcut: "Ctrl+Shift+F", action: () => {}, submenu: [
      { label: "Toggle Search", action: () => {} },
      { label: "Replace in Files", shortcut: "Ctrl+H", action: () => {} },
    ]},
    { label: "Source Control", shortcut: "Ctrl+Shift+G", action: () => {}, submenu: [
      { label: "Toggle Source Control", action: () => {} },
      { label: "Focus on Source Control", action: () => {} },
    ]},
    { label: "Run and Debug", shortcut: "Ctrl+Shift+D", action: () => {} },
    { label: "Extensions", shortcut: "Ctrl+Shift+X", action: () => {} },
    { separator: true },
    { label: "Command Palette...", shortcut: "Ctrl+Shift+P", action: () => {} },
    { separator: true },
    { label: "Appearance", submenu: [
      { label: "Zoom In", shortcut: "Ctrl++", action: () => {} },
      { label: "Zoom Out", shortcut: "Ctrl+-", action: () => {} },
      { label: "Reset Zoom", shortcut: "Ctrl+0", action: () => {} },
      { separator: true },
      { label: "Toggle Full Screen", shortcut: "F11", action: () => {} },
      { label: "Toggle Zen Mode", shortcut: "Ctrl+K Z", action: () => {} },
      { separator: true },
      { label: "Toggle Panel", shortcut: "Ctrl+J", action: () => {} },
      { label: "Toggle Secondary Side Bar", shortcut: "Ctrl+Alt+B", action: () => {} },
      { label: "Toggle Status Bar", action: () => {} },
    ]},
    { separator: true },
    { label: "Navigator", submenu: [
      { label: "Quick Open", shortcut: "Ctrl+P", action: () => {} },
      { label: "Go to File...", shortcut: "Ctrl+P", action: () => {} },
      { label: "Go to Symbol...", shortcut: "Ctrl+Shift+O", action: () => {} },
      { label: "Go to Line...", shortcut: "Ctrl+G", action: () => {} },
    ]},
  ],
}

const GO_MENU: MenuItem = {
  label: "Go",
  submenu: [
    { label: "Go to File...", shortcut: "Ctrl+P", action: () => {} },
    { label: "Go to Symbol in Workspace...", shortcut: "Ctrl+T", action: () => {} },
    { label: "Go to Symbol in Editor...", shortcut: "Ctrl+Shift+O", action: () => {} },
    { label: "Go to Line...", shortcut: "Ctrl+G", action: () => {} },
    { separator: true },
    { label: "Go to Definition", shortcut: "F12", action: () => {} },
    { label: "Go to Declaration", shortcut: "Ctrl+F12", action: () => {} },
    { label: "Go to Type Definition", shortcut: "Ctrl+Shift+O", action: () => {} },
    { label: "Go to Implementation", shortcut: "Ctrl+F12", action: () => {} },
    { separator: true },
    { label: "Go Back", shortcut: "Alt+Left", action: () => {} },
    { label: "Go Forward", shortcut: "Alt+Right", action: () => {} },
  ],
}

const RUN_MENU: MenuItem = {
  label: "Run",
  submenu: [
    { label: "Run Without Debugging", shortcut: "Ctrl+F5", action: () => {} },
    { label: "Start Debugging", shortcut: "F5", action: () => {} },
    { separator: true },
    { label: "Add Configuration...", action: () => {} },
    { separator: true },
    { label: "Run Task", submenu: [
      { label: "Run Build Task", shortcut: "Ctrl+Shift+B", action: () => {} },
      { label: "Run Test Task", action: () => {} },
    ]},
  ],
}

const TERMINAL_MENU: MenuItem = {
  label: "Terminal",
  submenu: [
    { label: "New Terminal", shortcut: "Ctrl+`", action: () => {} },
    { label: "Split Terminal", action: () => {} },
    { separator: true },
    { label: "Run Task", shortcut: "Ctrl+Shift+B", action: () => {} },
    { label: "Run Build Task...", action: () => {} },
    { label: "Run Active File", action: () => {} },
    { separator: true },
    { label: "Select Default Shell", action: () => {} },
  ],
}

const MENUS: MenuItem[] = [FILE_MENU, EDIT_MENU, VIEW_MENU, GO_MENU, RUN_MENU, TERMINAL_MENU]

export default function MenuBar(props: { onCommandPalette?: () => void }) {
  const [activeMenu, setActiveMenu] = createSignal<string | null>(null)

  const handleMenuClick = (menu: MenuItem) => {
    if (activeMenu() === menu.label) setActiveMenu(null)
    else setActiveMenu(menu.label)
  }

  const handleMouseLeave = () => setActiveMenu(null)

  const execute = (item: SubmenuItem) => {
    if (item.action) item.action()
    setActiveMenu(null)
  }

  return (
    <div class="flex items-center h-8 bg-surface-base border-b border-border-base px-1 select-none shrink-0" onMouseLeave={handleMouseLeave}>
      {/* VS Code logo / app icon */}
      <div class="flex items-center gap-1 px-2 h-full hover:bg-surface-raised-base-hover cursor-pointer">
        <Icon name="code" size="small" class="text-accent-base" />
      </div>

      {/* Menus */}
      <For each={MENUS}>{(menu) => (
        <div class="relative">
          <button
            type="button"
            class="px-3 py-0.5 text-13-regular h-full hover:bg-surface-raised-base-hover transition-colors cursor-default"
            classList={{ "bg-surface-raised-base": activeMenu() === menu.label }}
            onClick={() => handleMenuClick(menu)}
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
                    <Show when={item.submenu}>
                      <div class="relative group">
                        <button
                          type="button"
                          class="w-full flex items-center justify-between px-3 py-1.5 text-13-regular text-text-weak hover:bg-accent-base hover:text-white transition-colors cursor-default"
                          disabled={item.disabled}
                          classList={{ "opacity-50 cursor-not-allowed": item.disabled }}
                          onClick={() => execute(item)}
                        >
                          <span>{item.label}</span>
                          <span class="text-11-regular ml-6 opacity-70">▶</span>
                        </button>
                      </div>
                    </Show>
                    <Show when={!item.submenu}>
                      <button
                        type="button"
                        class="w-full flex items-center justify-between px-3 py-1.5 text-13-regular text-text-weak hover:bg-accent-base hover:text-white transition-colors cursor-default"
                        disabled={item.disabled}
                        classList={{ "opacity-50 cursor-not-allowed": item.disabled }}
                        onClick={() => execute(item)}
                      >
                        <span>{item.label}</span>
                        <Show when={item.shortcut}>
                          <span class="text-11-regular ml-6 opacity-70">{item.shortcut}</span>
                        </Show>
                      </button>
                    </Show>
                  </Show>
                </>
              )}</For>
            </div>
          </Show>
        </div>
      )}</For>
    </div>
  )
}

export { MENUS }