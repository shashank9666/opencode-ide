export type FileNode = {
  path: string
  name: string
  type: "file" | "directory"
  children?: FileNode[]
  expanded?: boolean
  ignored?: boolean
}

export type EditorFile = {
  path: string
  content: string
  language: string
  dirty: boolean
  pinned?: boolean
}

export type Tab = {
  id: string
  path: string
  name: string
  dirty?: boolean
  pinned?: boolean
}

export type Panel = {
  id: string
  label: string
  icon: string
  position: "left" | "right" | "bottom"
  visible: boolean
  width?: number
  height?: number
  order: number
}

export type Terminal = {
  id: string
  title: string
  shell: string
  cwd: string
}

export type GitBranch = {
  name: string
  active: boolean
}

export type GitCommit = {
  hash: string
  message: string
  author: string
  date: string
  branch: string
}

export type Diagnostic = {
  file: string
  line: number
  column: number
  severity: "error" | "warning" | "info"
  message: string
  source?: string
}

export type CompletionItem = {
  label: string
  kind: string
  detail?: string
  documentation?: string
  insertText: string
}

export type Extension = {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  installed: boolean
  enabled: boolean
  category: string
}

export type Theme = {
  id: string
  name: string
  type: "dark" | "light" | "high-contrast"
  colors: Record<string, string>
}

export type Keybinding = {
  id: string
  key: string
  command: string
  when?: string
  source?: "user" | "extension" | "default"
}

export type Snippet = {
  prefix: string
  description: string
  body: string
  scope?: string
}

export type Setting = {
  key: string
  value: unknown
  type: "string" | "number" | "boolean" | "object" | "array"
  description?: string
  scope: "user" | "workspace" | "folder"
}

export type WorkspacePreset = {
  id: string
  name: string
  icon: string
  description: string
  panels: Record<string, { position: string; visible: boolean }>
}

export type AIAction = {
  id: string
  title: string
  description: string
  icon: string
  prompt: string
}

export type DebugBreakpoint = {
  id: string
  file: string
  line: number
  enabled: boolean
  condition?: string
  hitCount?: number
}

export type DebugSession = {
  id: string
  name: string
  type: string
  state: "running" | "stopped" | "paused" | "terminated"
  breakpoints: DebugBreakpoint[]
  callStack: StackFrame[]
  variables: Record<string, unknown>
  watchExpressions: string[]
}

export type StackFrame = {
  id: string
  name: string
  file: string
  line: number
  column: number
}

export type TestCase = {
  id: string
  name: string
  file: string
  suite?: string
  status: "passed" | "failed" | "skipped" | "running"
  duration?: number
  error?: string
}