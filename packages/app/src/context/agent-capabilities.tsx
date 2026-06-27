import { createStore } from "solid-js/store"
import { createSimpleContext } from "@opencode-ai/ui/context"

export type CapabilityID =
  | "file-read"
  | "file-edit"
  | "file-create"
  | "file-delete"
  | "file-rename"
  | "file-move"
  | "codebase-search"
  | "terminal-execute"
  | "browser-automate"
  | "git-operations"
  | "run-tests"
  | "run-formatter"
  | "run-linter"
  | "package-install"
  | "build"
  | "deploy"
  | "debug"
  | "mcp-tools"

export type CapabilityStatus = "available" | "active" | "unavailable"

export type CapabilityGroup = "fileOps" | "code" | "terminal" | "browser" | "git" | "build-deploy" | "debug" | "mcp"

export interface Capability {
  id: CapabilityID
  name: string
  description: string
  icon: string
  group: CapabilityGroup
  status: CapabilityStatus
  usageCount: number
}

export interface CapabilityGroupInfo {
  id: CapabilityGroup
  name: string
  icon: string
}

export const capabilityGroups: CapabilityGroupInfo[] = [
  { id: "fileOps", name: "File Operations", icon: "folder" },
  { id: "code", name: "Code", icon: "code" },
  { id: "terminal", name: "Terminal", icon: "terminal" },
  { id: "browser", name: "Browser", icon: "browser" },
  { id: "git", name: "Git", icon: "branch" },
  { id: "build-deploy", name: "Build & Deploy", icon: "settings-gear" },
  { id: "debug", name: "Debug", icon: "glasses" },
  { id: "mcp", name: "MCP", icon: "mcp" },
] as const

const initialCapabilities: Omit<Capability, "status" | "usageCount">[] = [
  { id: "file-read", name: "Read Files", description: "Read and preview file contents from the project", icon: "eye", group: "fileOps" },
  { id: "file-edit", name: "Edit Files", description: "Modify and update existing file contents", icon: "edit", group: "fileOps" },
  { id: "file-create", name: "Create Files", description: "Create new files and directories", icon: "plus", group: "fileOps" },
  { id: "file-delete", name: "Delete Files", description: "Remove files and directories from the project", icon: "trash", group: "fileOps" },
  { id: "file-rename", name: "Rename Files", description: "Rename files and directories", icon: "edit-small-2", group: "fileOps" },
  { id: "file-move", name: "Move Files", description: "Move files between directories", icon: "folder-add-left", group: "fileOps" },
  { id: "codebase-search", name: "Codebase Search", description: "Search across the entire project for code and text", icon: "magnifying-glass", group: "code" },
  { id: "terminal-execute", name: "Terminal Execution", description: "Run shell commands and scripts in the terminal", icon: "terminal", group: "terminal" },
  { id: "browser-automate", name: "Browser Automation", description: "Navigate, click, fill forms, and scrape web pages", icon: "browser", group: "browser" },
  { id: "git-operations", name: "Git Operations", description: "Commit, push, pull, branch, and view diffs", icon: "branch", group: "git" },
  { id: "run-tests", name: "Run Tests", description: "Execute test suites and view results", icon: "checklist", group: "build-deploy" },
  { id: "run-formatter", name: "Formatter", description: "Format code according to project style rules", icon: "code-lines", group: "build-deploy" },
  { id: "run-linter", name: "Linter", description: "Lint code for style and correctness issues", icon: "code", group: "build-deploy" },
  { id: "package-install", name: "Package Installs", description: "Install, update, and manage package dependencies", icon: "cloud-upload", group: "build-deploy" },
  { id: "build", name: "Build", description: "Compile and build the project artifacts", icon: "settings-gear", group: "build-deploy" },
  { id: "deploy", name: "Deploy", description: "Deploy the project to staging or production environments", icon: "cloud-upload", group: "build-deploy" },
  { id: "debug", name: "Debug", description: "Debug running processes and inspect runtime state", icon: "glasses", group: "debug" },
  { id: "mcp-tools", name: "Execute MCP Tools", description: "Invoke tools provided by connected MCP servers", icon: "mcp", group: "mcp" },
]

function initCapabilities() {
  const initial: Record<CapabilityID, Capability> = {} as Record<CapabilityID, Capability>
  for (const c of initialCapabilities) {
    initial[c.id] = { ...c, status: "available", usageCount: 0 }
  }

  const [store, setStore] = createStore(initial)

  const capabilities = () => Object.values(store) as Capability[]

  const activeCapabilities = () => capabilities().filter((c) => c.status === "active")

  const enable = (id: CapabilityID) => {
    setStore(id, "status", "active")
  }

  const disable = (id: CapabilityID) => {
    setStore(id, "status", "available")
  }

  const setUnavailable = (id: CapabilityID) => {
    setStore(id, "status", "unavailable")
  }

  const execute = (id: CapabilityID, _params?: Record<string, unknown>) => {
    setStore(id, "usageCount", (c) => c + 1)
  }

  const resetUsage = (id?: CapabilityID) => {
    if (id) {
      setStore(id, "usageCount", 0)
    } else {
      for (const c of initialCapabilities) {
        setStore(c.id, "usageCount", 0)
      }
    }
  }

  return { capabilities, activeCapabilities, enable, disable, setUnavailable, execute, resetUsage }
}

export const { use: useAgentCapabilities, provider: AgentCapabilitiesProvider } = createSimpleContext({
  name: "AgentCapabilities",
  gate: false,
  init: initCapabilities,
})
