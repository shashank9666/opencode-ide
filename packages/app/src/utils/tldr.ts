/**
 * TLDR Pages integration
 * Fetches command documentation from the tldr-pages GitHub repository.
 * Uses the raw GitHub content API (no auth needed for public repos).
 */

export interface TldrEntry {
  command: string
  description: string
  examples: { command: string; description: string }[]
  platform?: string
}

const cache = new Map<string, TldrEntry>()

const TLDR_RAW_BASE = "https://raw.githubusercontent.com/tldr-pages/tldr/main/pages"

function getPlatform(): string {
  if (typeof navigator === "undefined") return "common"
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes("win")) return "windows"
  if (ua.includes("mac")) return "osx"
  if (ua.includes("linux")) return "linux"
  return "common"
}

function parseTldrContent(content: string, command: string): TldrEntry {
  const lines = content.split("\n")
  const entry: TldrEntry = {
    command,
    description: "",
    examples: [],
  }

  let pendingDesc = ""

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) continue

    // Description line (> prefix)
    if (trimmed.startsWith("> ")) {
      pendingDesc = trimmed
        .slice(2)
        .replace(/\{\{(.*?)\}\}/g, (_, match) => `⟨${match}⟩`)
        .replace(/> .*/g, "")
        .trim()
      continue
    }

    // Command line: starts with backtick
    if (trimmed.startsWith("`")) {
      const cmd = trimmed
        .replace(/`/g, "")
        .replace(/\{\{(.*?)\}\}/g, (_, match) => `<${match}>`)
      if (!entry.description && pendingDesc) {
        entry.description = pendingDesc
      }
      entry.examples.push({ command: cmd, description: pendingDesc })
      pendingDesc = ""
    }
  }

  if (!entry.description && entry.examples.length > 0) {
    entry.description = `Usage examples for ${command}`
  }

  return entry
}

export async function fetchTldr(command: string): Promise<TldrEntry | null> {
  const normalized = command.toLowerCase().trim()
  if (!normalized) return null

  if (cache.has(normalized)) return cache.get(normalized)!

  const platform = getPlatform()

  const paths = [
    `${TLDR_RAW_BASE}/${platform}/${normalized}.md`,
    `${TLDR_RAW_BASE}/common/${normalized}.md`,
  ]

  for (const url of paths) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        const content = await response.text()
        const entry = parseTldrContent(content, normalized)
        cache.set(normalized, entry)
        return entry
      }
    } catch {
      continue
    }
  }

  return null
}

export function formatTldrForTerminal(entry: TldrEntry): string {
  const lines: string[] = []
  lines.push(`\x1b[1m${entry.command}\x1b[0m`)
  lines.push(`  ${entry.description}`)
  lines.push("")
  lines.push("Examples:")
  for (const example of entry.examples) {
    lines.push(`  \x1b[36m${example.command}\x1b[0m`)
  }
  return lines.join("\n")
}

export function formatTldrForChat(entry: TldrEntry): string {
  const lines: string[] = []
  lines.push(`## ${entry.command}`)
  lines.push("")
  lines.push(entry.description)
  lines.push("")
  lines.push("**Examples:**")
  lines.push("")
  for (const example of entry.examples) {
    lines.push(`- \`${example.command}\``)
  }
  return lines.join("\n")
}
