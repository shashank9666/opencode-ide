import { Show, createSignal } from "solid-js"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { TooltipKeybind } from "@opencode-ai/ui/tooltip"
import { useLanguage } from "@/context/language"
import { useCommand } from "@/context/command"

export function AddContextMenu(props: {
  onMedia: () => void
  onMentions: () => void
  onActions: () => void
  onVoice: () => void
  disabled?: boolean
  tabIndex?: number
  class?: string
  style?: any
}) {
  const language = useLanguage()
  const command = useCommand()
  const [open, setOpen] = createSignal(false)

  return (
    <DropdownMenu open={open()} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <TooltipKeybind
          placement="top"
          title={language.t("prompt.action.attachFile")}
          keybind={command.keybind("file.attach")}
        >
          <IconButton
            data-action="prompt-attach"
            type="button"
            icon="plus"
            variant="ghost"
            class={props.class}
            style={props.style}
            disabled={props.disabled}
            tabIndex={props.tabIndex}
            aria-label={language.t("prompt.action.attachFile")}
          />
        </TooltipKeybind>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="w-48">
          <DropdownMenu.Group>
            <DropdownMenu.GroupLabel>Add Context</DropdownMenu.GroupLabel>
            <DropdownMenu.Item onSelect={props.onMedia}>
              <DropdownMenu.ItemLabel class="flex items-center gap-2">
                <span class="text-12">📷</span> Media
              </DropdownMenu.ItemLabel>
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={props.onMentions}>
              <DropdownMenu.ItemLabel class="flex items-center gap-2">
                <span class="text-12">@</span> Mentions
              </DropdownMenu.ItemLabel>
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={props.onActions}>
              <DropdownMenu.ItemLabel class="flex items-center gap-2">
                <span class="text-12">⚡</span> Actions
              </DropdownMenu.ItemLabel>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onSelect={props.onVoice}>
              <DropdownMenu.ItemLabel class="flex items-center gap-2">
                <span class="text-12">🎤</span> Voice Mode
              </DropdownMenu.ItemLabel>
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu>
  )
}
