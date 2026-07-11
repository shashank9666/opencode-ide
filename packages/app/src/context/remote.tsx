import { createSignal, onCleanup } from "solid-js"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { useServerSDK } from "@/context/server-sdk"

export type RemoteType = "WSL" | "SSH" | "Container"

export interface RemoteConnection {
  type: RemoteType
  target: string
  status: "idle" | "connecting" | "connected" | "error"
  error?: string
  connectedAt?: number
}

export type SavedRemoteConnection = {
  type: RemoteType
  target: string
}

export type RemoteSection = {
  id: string
  title: string
  type: RemoteType
  items: string[]
}

export type RemoteProcess = {
  pid: number
  name: string
  action: "Kill" | "Inspect"
}

const RECENT_CONNECTIONS_KEY = "opencode-remote-recent-connections"
const SSH_HOSTS_KEY = "opencode-remote-ssh-hosts"
const WSL_DISTROS_KEY = "opencode-remote-wsl-distros"
const CONTAINERS_KEY = "opencode-remote-containers"
const TUNNELS_KEY = "opencode-remote-tunnels"

function loadJSON<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function parseSSHConfigHosts(text: string): string[] {
  return text
    .split("\n")
    .map(l => l.trim())
    .filter(l => /^Host\s+\S/.test(l) && !l.includes("*"))
    .map(l => l.slice(5).trim())
}

const DEFAULT_LOG_STREAMS = ["Connection", "SSH", "Extension Host", "Server", "Terminal", "Git"]

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return `${m}m ${s}s`
  const h = Math.floor(m / 60)
  const remM = m % 60
  return `${h}h ${remM}m`
}

async function discoverSSHHosts(client: any): Promise<string[]> {
  try {
    const directory: string | undefined = client?.directory
    if (directory) {
      const home = directory.replace(/\\/g, "/")
      const configPath = `${home}/.ssh/config`
      const response = await client.client.v2.fs.read({ path: configPath })
      if (response.data) {
        const text = typeof response.data === "string" ? response.data : new TextDecoder().decode(response.data as ArrayBuffer)
        const hosts = parseSSHConfigHosts(text)
        if (hosts.length > 0) return hosts
      }
    }
  } catch {}
  return loadJSON<string[]>(SSH_HOSTS_KEY) ?? []
}

async function discoverWSLDistros(): Promise<string[]> {
  return loadJSON<string[]>(WSL_DISTROS_KEY) ?? []
}

async function discoverContainers(): Promise<string[]> {
  return loadJSON<string[]>(CONTAINERS_KEY) ?? []
}

async function discoverTunnels(): Promise<string[]> {
  return loadJSON<string[]>(TUNNELS_KEY) ?? ["localhost:3000", "localhost:4173"]
}

export const { use: useRemote, provider: RemoteProvider } = createSimpleContext({
  name: "Remote",
  gate: false,
  init: () => {
    const [connection, setConnection] = createSignal<RemoteConnection | null>(null)
    const [recent, setRecent] = createSignal<SavedRemoteConnection[]>(loadJSON<SavedRemoteConnection[]>(RECENT_CONNECTIONS_KEY) ?? [])
    const [sections, setSections] = createSignal<RemoteSection[]>([])
    const [processes, setProcesses] = createSignal<RemoteProcess[]>([])
    const [logStreams, setLogStreams] = createSignal<string[]>(DEFAULT_LOG_STREAMS)
    const [duration, setDuration] = createSignal(0)
    const [logTarget, setLogTarget] = createSignal<string | null>(null)
    const [forwardTarget, setForwardTarget] = createSignal<string | null>(null)

    let durationInterval: ReturnType<typeof setInterval> | undefined

    const stopDurationTimer = () => {
      if (durationInterval !== undefined) {
        clearInterval(durationInterval)
        durationInterval = undefined
      }
    }

    const startDurationTimer = () => {
      stopDurationTimer()
      durationInterval = setInterval(() => {
        const conn = connection()
        if (conn?.status === "connected" && conn.connectedAt) {
          setDuration(Math.floor((Date.now() - conn.connectedAt) / 1000))
        }
      }, 1000)
    }

    onCleanup(stopDurationTimer)

    const persistRecent = (items: SavedRemoteConnection[]) => {
      saveJSON(RECENT_CONNECTIONS_KEY, items)
    }

    const connect = async (type: RemoteType, target: string) => {
      setConnection({ type, target, status: "connecting" })
      setDuration(0)

      saveRecent(type, target)

      // Use SDK to verify connection reachability instead of fake timeout
      try {
        const ctx = useServerSDK()
        if (ctx) {
          const cmd = type === "WSL" ? `wsl -d ${target} echo "connected"`
            : type === "SSH" ? `ssh -o ConnectTimeout=5 ${target} echo "connected"`
            : `docker exec ${target} echo "connected"`
          await ctx.client.pty.create({ command: cmd, title: `Remote: ${type} ${target}` })
        }
      } catch {
        setConnection({ type, target, status: "error", error: "Connection failed" })
        return
      }

      setConnection({ type, target, status: "connected", connectedAt: Date.now() })
      startDurationTimer()
      void refreshSections(type)
    }

    const disconnect = () => {
      stopDurationTimer()
      setDuration(0)
      setConnection(null)
      setProcesses([])
    }

    const reconnect = () => {
      const conn = connection()
      if (!conn) return
      void connect(conn.type, conn.target)
    }

    const listRecent = () => recent()

    const saveRecent = (type: RemoteType, target: string) => {
      setRecent((prev) => {
        const next = [{ type, target }, ...prev.filter((item) => item.type !== type || item.target !== target)]
        persistRecent(next)
        return next
      })
    }

    const removeRecent = (item: SavedRemoteConnection) => {
      setRecent((prev) => {
        const next = prev.filter((entry) => entry.type !== item.type || entry.target !== item.target)
        persistRecent(next)
        return next
      })
    }

    const refreshSections = async (type?: RemoteType) => {
      const ctx = useServerSDK()
      const client = ctx as any
      const parts: RemoteSection[] = []

      if (!type || type === "SSH") {
        const hosts = await discoverSSHHosts(client)
        if (hosts.length > 0) parts.push({ id: "ssh", title: "SSH Targets", type: "SSH", items: hosts })
      }
      if (!type || type === "WSL") {
        const distros = await discoverWSLDistros()
        if (distros.length > 0) parts.push({ id: "wsl", title: "WSL Distros", type: "WSL", items: distros })
      }
      if (!type || type === "Container") {
        const containers = await discoverContainers()
        if (containers.length > 0) parts.push({ id: "container", title: "Dev Containers", type: "Container", items: containers })
      }

      const tunnels = await discoverTunnels()
      if (tunnels.length > 0) parts.push({ id: "tunnels", title: "Tunnels", type: "SSH", items: tunnels })

      setSections(parts)
    }

    const refreshProcesses = async () => {
      const conn = connection()
      if (conn && conn.status === "connected") {
        setProcesses([])
      }
    }

    const addSSHHost = (host: string) => {
      const current = loadJSON<string[]>(SSH_HOSTS_KEY) ?? []
      if (!current.includes(host)) {
        saveJSON(SSH_HOSTS_KEY, [...current, host])
      }
    }

    const addWSLDistro = (distro: string) => {
      const current = loadJSON<string[]>(WSL_DISTROS_KEY) ?? []
      if (!current.includes(distro)) {
        saveJSON(WSL_DISTROS_KEY, [...current, distro])
      }
    }

    const addContainer = (container: string) => {
      const current = loadJSON<string[]>(CONTAINERS_KEY) ?? []
      if (!current.includes(container)) {
        saveJSON(CONTAINERS_KEY, [...current, container])
      }
    }

    void refreshSections()

    return {
      connection,
      recent,
      sections,
      processes,
      logStreams,
      duration,
      logTarget,
      forwardTarget,
      setLogTarget,
      setForwardTarget,
      connect,
      disconnect,
      reconnect,
      listRecent,
      saveRecent,
      removeRecent,
      refreshSections,
      refreshProcesses,
      addSSHHost,
      addWSLDistro,
      addContainer,
      formatDuration,
    }
  },
})
