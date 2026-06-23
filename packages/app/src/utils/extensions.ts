/**
 * Extension Management System
 *
 * Manages third-party extensions as npm packages.
 * Each extension is an npm package that follows a convention:
 * - package.json with "opencode" field
 * - Provides Monaco language configs, themes, formatters
 * - Optional CLI tool for formatting
 */

export interface ThirdPartyExtension {
  id: string
  name: string
  description: string
  publisher: string
  version: string
  installed: boolean
  enabled: boolean
  category: string
  icon?: string
  npmPackage: string
  // Capabilities provided by the extension
  capabilities: {
    languages?: Array<{ id: string; extensions: string[]; aliases?: string[] }>
    themes?: Array<{ id: string; label: string; kind: "vs-dark" | "vs-light" }>
    formatters?: Array<{ command: string; languages: string[] }>
    snippets?: Array<{ language: string; prefix: string; body: string }>
  }
}

// Pre-defined extension registry (in real implementation, this would come from a registry API)
export const EXTENSION_REGISTRY: ThirdPartyExtension[] = [
  {
    id: "ext-tldr",
    name: "TLDR Pages",
    description: "Quick command reference via tldr-pages integration",
    publisher: "tldr-pages",
    version: "1.0.0",
    installed: false,
    enabled: false,
    category: "ai",
    npmPackage: "tldr",
    capabilities: {},
  },
  {
    id: "ext-prettier",
    name: "Prettier",
    description: "Code formatter supporting many languages",
    publisher: "prettier",
    version: "3.0.0",
    installed: false,
    enabled: false,
    category: "linting",
    npmPackage: "prettier",
    capabilities: {
      languages: [],
      formatters: [
        { command: "prettier", languages: ["javascript", "typescript", "css", "html", "json", "markdown"] },
      ],
    },
  },
  {
    id: "ext-eslint",
    name: "ESLint",
    description: "JavaScript/TypeScript linter with auto-fix",
    publisher: "eslint",
    version: "8.0.0",
    installed: false,
    enabled: false,
    category: "linting",
    npmPackage: "eslint",
    capabilities: {
      languages: [],
      formatters: [
        { command: "eslint --fix", languages: ["javascript", "typescript"] },
      ],
    },
  },
  {
    id: "ext-beautify",
    name: "Beautify",
    description: "Format HTML, CSS, JavaScript, and more",
    publisher: "vesln",
    version: "3.0.0",
    installed: false,
    enabled: false,
    category: "linting",
    npmPackage: "js-beautify",
    capabilities: {
      formatters: [
        { command: "js-beautify", languages: ["javascript", "html", "css"] },
      ],
    },
  },
  {
    id: "ext-import-cost",
    name: "Import Cost",
    description: "Display the size of imported packages inline",
    publisher: "wix",
    version: "3.0.0",
    installed: false,
    enabled: false,
    category: "language",
    npmPackage: "import-cost",
    capabilities: {
      languages: [
        { id: "typescript", extensions: [".ts", ".tsx"], aliases: ["ts", "tsx"] },
        { id: "javascript", extensions: [".js", ".jsx"], aliases: ["js", "jsx"] },
      ],
    },
  },
  {
    id: "ext-rainbow-csv",
    name: "Rainbow CSV",
    description: "Highlight CSV/TSV/PSV files with per-column colors",
    publisher: "mechatroner",
    version: "3.0.0",
    installed: false,
    enabled: false,
    category: "language",
    npmPackage: "rainbow-csv",
    capabilities: {
      languages: [
        { id: "csv", extensions: [".csv"], aliases: ["csv"] },
        { id: "tsv", extensions: [".tsv"], aliases: ["tsv"] },
        { id: "psv", extensions: [".psv"], aliases: ["psv"] },
      ],
    },
  },
  {
    id: "ext-npm-intellisense",
    name: "NPM Intellisense",
    description: "Autocompletes npm modules in import statements",
    publisher: "christian-kohler",
    version: "1.4.0",
    installed: false,
    enabled: false,
    category: "language",
    npmPackage: "npm-intellisense",
    capabilities: {},
  },
  {
    id: "ext-color-highlight",
    name: "Color Highlight",
    description: "Highlight colors in the editor with inline previews",
    publisher: "sergiirocks",
    version: "2.6.0",
    installed: false,
    enabled: false,
    category: "ui",
    npmPackage: "color-highlight",
    capabilities: {},
  },
  {
    id: "ext-auto-rename-tag",
    name: "Auto Rename Tag",
    description: "Auto rename paired HTML/XML tags",
    publisher: "jun-han",
    version: "1.0.0",
    installed: false,
    enabled: false,
    category: "language",
    npmPackage: "auto-rename-tag",
    capabilities: {
      languages: [
        { id: "html", extensions: [".html"], aliases: ["html"] },
        { id: "xml", extensions: [".xml"], aliases: ["xml"] },
      ],
    },
  },
  {
    id: "ext-bracket-pair",
    name: "Bracket Pair Colorizer",
    description: "Colorize matching brackets for easier code reading",
    publisher: "coenraads",
    version: "1.0.0",
    installed: false,
    enabled: false,
    category: "ui",
    npmPackage: "bracket-pair-colorizer",
    capabilities: {},
  },
  {
    id: "ext-gitlens",
    name: "GitLens",
    description: "Supercharge Git with blame, history, and code authorship insights",
    publisher: "gitkraken",
    version: "14.0.0",
    installed: false,
    enabled: false,
    category: "git",
    npmPackage: "gitlens",
    capabilities: {},
  },
  {
    id: "ext-copilot",
    name: "GitHub Copilot",
    description: "AI pair programmer with code suggestions and chat",
    publisher: "github",
    version: "1.0.0",
    installed: false,
    enabled: false,
    category: "ai",
    npmPackage: "@github/copilot",
    capabilities: {},
  },
  {
    id: "ext-python-ext",
    name: "Python",
    description: "Python language support with IntelliSense, linting, and debugging",
    publisher: "microsoft",
    version: "2024.0.0",
    installed: false,
    enabled: false,
    category: "language",
    npmPackage: "ms-python",
    capabilities: {
      languages: [
        { id: "python", extensions: [".py"], aliases: ["python", "py"] },
      ],
    },
  },
  {
    id: "ext-go-ext",
    name: "Go",
    description: "Go language support with gopls, debugging, and testing",
    publisher: "google",
    version: "1.0.0",
    installed: false,
    enabled: false,
    category: "language",
    npmPackage: "ms-go",
    capabilities: {
      languages: [
        { id: "go", extensions: [".go"], aliases: ["go"] },
      ],
    },
  },
  {
    id: "ext-rust-ext",
    name: "rust-analyzer",
    description: "Rust language support with advanced code analysis",
    publisher: "rust-lang",
    version: "1.0.0",
    installed: false,
    enabled: false,
    category: "language",
    npmPackage: "rust-analyzer",
    capabilities: {
      languages: [
        { id: "rust", extensions: [".rs"], aliases: ["rust", "rs"] },
      ],
    },
  },
]

const STORAGE_KEY = "opencode-third-party-extensions"

function loadExtensionState(): Record<string, { installed: boolean; enabled: boolean }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function saveExtensionState(state: Record<string, { installed: boolean; enabled: boolean }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getExtensions(): ThirdPartyExtension[] {
  const state = loadExtensionState()
  return EXTENSION_REGISTRY.map((ext) => ({
    ...ext,
    installed: state[ext.id]?.installed ?? false,
    enabled: state[ext.id]?.enabled ?? false,
  }))
}

export function installExtension(id: string): void {
  const state = loadExtensionState()
  state[id] = { installed: true, enabled: true }
  saveExtensionState(state)
}

export function uninstallExtension(id: string): void {
  const state = loadExtensionState()
  delete state[id]
  saveExtensionState(state)
}

export function toggleExtension(id: string): void {
  const state = loadExtensionState()
  if (state[id]) {
    state[id].enabled = !state[id].enabled
  }
  saveExtensionState(state)
}

export function getInstalledExtensions(): ThirdPartyExtension[] {
  return getExtensions().filter((e) => e.installed)
}

export function getEnabledLanguages(): Array<{ id: string; extensions: string[]; aliases?: string[] }> {
  const installed = getInstalledExtensions().filter((e) => e.enabled)
  const languages = new Map<string, { id: string; extensions: string[]; aliases?: string[] }>()

  for (const ext of installed) {
    if (ext.capabilities.languages) {
      for (const lang of ext.capabilities.languages) {
        if (!languages.has(lang.id)) {
          languages.set(lang.id, lang)
        }
      }
    }
  }

  return Array.from(languages.values())
}
