import { For, Show, createEffect, createSignal, createMemo } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Tooltip } from "@opencode-ai/ui/tooltip"

type RemoteType = "WSL" | "SSH" | "Container"

interface RemoteConnection {
  type: RemoteType
  target: string
  status: "idle" | "connecting" | "connected" | "error"
  error?: string
}

// Common paths for each remote type
const COMMON_PATHS: Record<RemoteType, string[]> = {
  WSL: ["/home", "/tmp", "/var/log", "/etc", "/opt"],
  SSH: ["/home", "/var/www", "/etc/nginx", "/opt", "/srv"],
  Container: ["/app", "/var/log", "/etc", "/tmp", "/root"],
}

// Remote type info
const TYPE_INFO: Record<RemoteType, { color: string; icon: string; label: string; command: string }> = {
  WSL: { color: "text-[#f97316]", icon: ">_", label: "WSL", command: "wsl" },
  SSH: { color: "text-[#3b82f6]", icon: "⚡", label: "SSH", command: "ssh" },
  Container: { color: "text-[#8b5cf6]", icon: "◈", label: "Docker", command: "docker exec -it" },
}

function QuickConnectButton(props: {
  type: RemoteType
  onConnect: (type: RemoteType, target: string) => void
}) {
  const [input, setInput] = createSignal("")
  const typeInfo = TYPE_INFO[props.type]

  return (
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center gap-2">
        <span class={`text-12-medium font-mono ${typeInfo.color}`}>{typeInfo.icon}</span>
        <span class="text-12-medium text-text-strong">{typeInfo.label}</span>
      </div>
      <div class="flex items-center gap-1">
        <input
          type="text"
          class="flex-1 px-2 py-1 text-12-regular bg-surface-base border border-border-base rounded text-text-strong placeholder:text-text-weaker"
          placeholder={
            props.type === "WSL" ? "e.g. ubuntu" :
            props.type === "SSH" ? "e.g. user@host" :
            "e.g. container-name"
          }
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input().trim()) {
              props.onConnect(props.type, input().trim())
            }
          }}
        />
        <button
          type="button"
          class="px-2 py-1 text-12-medium bg-accent-base text-white rounded hover:bg-accent-base-hover transition-colors"
          onClick={() => {
            if (input().trim()) props.onConnect(props.type, input().trim())
          }}
        >
          Connect
        </button>
      </div>
    </div>
  )
}

export default function RemotePanel(props: {
  connection?: string | null
  onFileClick?: (path: string) => void
  onDisconnect?: () => void
  onOpenTerminal?: (command: string, title: string) => void
}) {
  const [connectors, setConnectors] = createSignal(false)
  const [connection, setConnection] = createSignal<RemoteConnection | null>(null)
  const [currentPath, setCurrentPath] = createSignal("/")
  const [selectedRemoteType, setSelectedRemoteType] = createSignal<RemoteType>("WSL")

  createEffect(() => {
    const value = props.connection
    if (!value) {
      setConnection(null)
      return
    }

    const [type, ...targetParts] = value.split(": ")
    if (type === "WSL" || type === "SSH" || type === "Container") {
      setConnection({ type, target: targetParts.join(": "), status: "connected" })
    }
  })

  const isConnected = () => connection()?.status === "connected"
  const isConnecting = () => connection()?.status === "connecting"

  const handleConnect = (type: RemoteType, target: string) => {
    setConnection({ type, target, status: "connecting" })
    // Simulate connection (in real implementation, this would verify connectivity)
    setTimeout(() => {
      setConnection({ type, target, status: "connected" })
      setCurrentPath("/")
    }, 800)
  }

  const handleDisconnect = () => {
    setConnection(null)
    props.onDisconnect?.()
  }

  const openTerminal = () => {
    const conn = connection()
    if (!conn) return
    const typeInfo = TYPE_INFO[conn.type]
    let cmd: string
    let title: string
    if (conn.type === "WSL") {
      cmd = `wsl -d ${conn.target || "Ubuntu"}`
      title = `WSL: ${conn.target || "Ubuntu"}`
    } else if (conn.type === "SSH") {
      cmd = `ssh ${conn.target}`
      title = `SSH: ${conn.target}`
    } else {
      cmd = `docker exec -it ${conn.target} /bin/sh`
      title = `Docker: ${conn.target}`
    }
    props.onOpenTerminal?.(cmd, title)
  }

  const openPathInTerminal = (path: string) => {
    const conn = connection()
    if (!conn) return
    if (conn.type === "WSL") {
      props.onOpenTerminal?.(`wsl -d ${conn.target || "Ubuntu"} -- ls -la ${path}`, `WSL: ${path}`)
    } else if (conn.type === "SSH") {
      props.onOpenTerminal?.(`ssh ${conn.target} "ls -la ${path}"`, `SSH: ${path}`)
    } else {
      props.onOpenTerminal?.(`docker exec ${conn.target} ls -la ${path}`, `Docker: ${path}`)
    }
  }

  const commonPaths = createMemo(() => {
    const conn = connection()
    return conn ? COMMON_PATHS[conn.type] : []
  })

  const typeColor = (type: string) => {
    if (type === "WSL") return "text-[#f97316]"
    if (type === "SSH") return "text-[#3b82f6]"
    return "text-[#8b5cf6]"
  }

  return (
    <div class="size-full flex flex-col bg-surface-base">
      {/* Header */}
      <div class="flex items-center justify-between px-3 py-1.5 border-b border-border-base shrink-0" style={{ "min-height": "34px" }}>
        <span class="text-11-medium text-text-weaker uppercase tracking-wider">REMOTE EXPLORER</span>
        <div class="flex items-center gap-1">
          <Show when={isConnected()}>
            <Tooltip value="Open Remote Terminal" placement="bottom">
              <IconButton
                icon="terminal"
                variant="ghost"
                size="small"
                class="size-5"
                onClick={openTerminal}
                aria-label="Open Remote Terminal"
              />
            </Tooltip>
          </Show>
          <Tooltip value="Refresh" placement="bottom">
            <IconButton
              icon="reset"
              variant="ghost"
              size="small"
              class="size-5"
              aria-label="Refresh"
            />
          </Tooltip>
        </div>
      </div>

      <Show
        when={isConnected()}
        fallback={
          <div class="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
            <div class="w-12 h-12 rounded-full bg-surface-raised-base flex items-center justify-center">
              <Icon name="server" size="large" class="text-icon-weaker opacity-50" />
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-13-medium text-text-weak">Remote Connections</span>
              <span class="text-12-regular text-text-weaker">Connect to WSL, SSH, or Docker environments</span>
            </div>

            {/* Connection options */}
            <div class="w-full max-w-xs space-y-3">
              <For each={(["WSL", "SSH", "Container"] as RemoteType[])}>
                {(type) => {
                  const typeInfo = TYPE_INFO[type]
                  return (
                    <button
                      type="button"
                      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border-base hover:border-border-strong bg-surface-raised-base hover:bg-surface-raised-base-hover transition-all text-left group"
                      onClick={() => {
                        setSelectedRemoteType(type)
                        setConnectors(true)
                      }}
                    >
                      <span class={`text-14-medium font-mono ${typeInfo.color}`}>{typeInfo.icon}</span>
                      <div class="flex-1 min-w-0">
                        <div class="text-13-medium text-text-strong">{typeInfo.label}</div>
                        <div class="text-11-regular text-text-weaker">
                          {type === "WSL" ? "Windows Subsystem for Linux" :
                           type === "SSH" ? "Secure Shell Connection" :
                           "Docker Container Access"}
                        </div>
                      </div>
                      <Icon name="chevron-right" size="small" class="text-icon-weaker group-hover:text-text-weak transition-colors" />
                    </button>
                  )
                }}
              </For>

              <Show when={connectors()}>
                <div class="border border-border-base rounded-lg p-3 space-y-2 bg-surface-raised-base">
                  <div class="flex items-center justify-between">
                    <span class="text-12-medium text-text-strong">
                      Connect to {TYPE_INFO[selectedRemoteType()].label}
                    </span>
                    <IconButton
                      icon="close-small"
                      variant="ghost"
                      size="small"
                      class="size-4"
                      onClick={() => setConnectors(false)}
                    />
                  </div>
                  <QuickConnectButton type={selectedRemoteType()} onConnect={handleConnect} />
                </div>
              </Show>
            </div>

            <span class="text-11-regular text-text-weaker mt-1">
              Remote connections run through the integrated terminal
            </span>
          </div>
        }
      >
        {/* Connected state */}
        <>
          {/* Connection badge */}
          <div class="px-3 py-2 border-b border-border-base shrink-0 flex items-center justify-between gap-2">
            <div class="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md bg-surface-raised-base border border-border-base/50 min-w-0">
              <span class={`text-14-medium font-mono shrink-0 ${typeColor(connection()!.type)}`}>
                {TYPE_INFO[connection()!.type].icon}
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-12-medium text-text-strong truncate">
                  {connection()!.type}: {connection()!.target}
                </div>
                <div class="text-11-regular text-text-success-base flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-text-success-base inline-block" />
                  Connected
                </div>
              </div>
            </div>
            <Show when={props.onDisconnect}>
              <IconButton
                icon="close"
                variant="ghost"
                size="small"
                class="size-7 rounded hover:bg-surface-raised-base hover:text-text-danger-base transition-colors shrink-0"
                title="Disconnect"
                onClick={handleDisconnect}
              />
            </Show>
          </div>

          {/* Quick actions */}
          <div class="px-3 py-2 border-b border-border-base shrink-0">
            <div class="text-11-medium text-text-weaker uppercase tracking-wider mb-2">Quick Actions</div>
            <div class="space-y-1.5">
              <button
                type="button"
                class="w-full flex items-center gap-2 px-2 py-1.5 text-12-regular text-text-weak hover:text-text-strong bg-surface-raised-base rounded transition-colors"
                onClick={openTerminal}
              >
                <Icon name="terminal" size="small" class="shrink-0" />
                <span>Open Remote Terminal</span>
              </button>
              <Show when={connection()!.type === "WSL"}>
                <button
                  type="button"
                  class="w-full flex items-center gap-2 px-2 py-1.5 text-12-regular text-text-weak hover:text-text-strong bg-surface-raised-base rounded transition-colors"
                  onClick={() => props.onOpenTerminal?.(`wsl -d ${connection()!.target || "Ubuntu"} -- bash`, `WSL: ${connection()!.target || "Ubuntu"} (bash)`)}
                >
                  <Icon name="terminal" size="small" class="shrink-0" />
                  <span>Open Bash Shell</span>
                </button>
              </Show>
            </div>
          </div>

          {/* Common paths */}
          <div class="px-3 py-2 border-b border-border-base shrink-0">
            <div class="text-11-medium text-text-weaker uppercase tracking-wider mb-2">Common Paths</div>
            <div class="space-y-0.5">
              <For each={commonPaths()}>
                {(path) => (
                  <button
                    type="button"
                    class="w-full flex items-center gap-2 px-2 py-1 text-12-regular text-text-weak hover:text-text-strong hover:bg-surface-raised-base-hover rounded transition-colors"
                    onClick={() => openPathInTerminal(path)}
                  >
                    <Icon name="folder" size="small" class="shrink-0 text-icon-weaker" />
                    <span class="truncate">{path}</span>
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* File system info */}
          <div class="flex-1 overflow-y-auto px-3 py-3">
            <div class="text-11-medium text-text-weaker uppercase tracking-wider mb-2">File System</div>
            <div class="space-y-1">
              <For each={commonPaths()}>
                {(path) => (
                  <button
                    type="button"
                    class="w-full flex items-center gap-2 px-2 py-1.5 text-12-regular text-text-weak hover:text-text-strong bg-surface-raised-base rounded transition-colors text-left"
                    onClick={() => openPathInTerminal(path)}
                  >
                    <Icon name="folder" size="small" class="shrink-0 text-[#e8b55b]" />
                    <span class="truncate flex-1">{path}</span>
                  </button>
                )}
              </For>
            </div>
          </div>
        </>
      </Show>
    </div>
  )
}
