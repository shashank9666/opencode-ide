/**
 * Markdown Service Worker Manager
 *
 * Offloads markdown→HTML rendering to a service worker
 * so the main thread stays responsive during preview.
 */

let sw: ServiceWorker | null = null
let swReady: Promise<ServiceWorker> | null = null
let renderIdCounter = 0
const pendingRenders = new Map<string, { resolve: (html: string) => void; reject: (err: Error) => void }>()

function getSWUrl(): string {
  // In dev mode (Vite), public/ files are served at root
  // In production build, same — public/ is copied to dist/
  return "/sw-markdown.js"
}

function register(): Promise<ServiceWorker> {
  if (swReady) return swReady

  swReady = (async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers not supported")
    }

    const reg = await navigator.serviceWorker.register(getSWUrl(), {
      scope: "/",
    })

    // Wait until the SW is active
    if (reg.active) {
      sw = reg.active
      return sw
    }

    // Wait for the installing worker to become active
    const worker = reg.installing ?? reg.waiting
    if (!worker) throw new Error("Service worker in unexpected state")

    return new Promise<ServiceWorker>((resolve, reject) => {
      const onStateChange = () => {
        if (worker.state === "activated") {
          worker.removeEventListener("statechange", onStateChange)
          sw = worker
          resolve(worker)
        } else if (worker.state === "redundant") {
          worker.removeEventListener("statechange", onStateChange)
          reject(new Error("Service worker became redundant"))
        }
      }
      worker.addEventListener("statechange", onStateChange)
    })
  })()

  return swReady
}

// Listen for responses from the service worker
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    const { data } = event
    if (!data || data.type !== "rendered") return

    const pending = pendingRenders.get(data.id)
    if (!pending) return

    pendingRenders.delete(data.id)
    if (data.error) {
      pending.reject(new Error(data.html))
    } else {
      pending.resolve(data.html)
    }
  })
}

export interface MarkdownRenderOptions {
  /** Enable syntax highlighting (default: true) */
  highlight?: boolean
  /** Enable math/KaTeX rendering (default: false — heavy for SW) */
  math?: boolean
}

/**
 * Render markdown to HTML using the service worker.
 * Falls back to synchronous rendering if the SW is unavailable.
 */
export async function renderMarkdown(
  markdown: string,
  options?: MarkdownRenderOptions,
): Promise<string> {
  if (!markdown) return ""

  try {
    const worker = await register()
    return new Promise<string>((resolve, reject) => {
      const id = `md-${++renderIdCounter}-${Date.now()}`
      const timeout = setTimeout(() => {
        pendingRenders.delete(id)
        reject(new Error("Markdown render timeout"))
      }, 5000)

      pendingRenders.set(id, {
        resolve: (html) => {
          clearTimeout(timeout)
          resolve(html)
        },
        reject: (err) => {
          clearTimeout(timeout)
          reject(err)
        },
      })

      worker.postMessage({
        type: "render",
        id,
        markdown,
        options,
      })
    })
  } catch (err) {
    // Fallback: render on main thread using the same parser logic
    console.warn("[markdown-sw] Falling back to main-thread render:", err)
    return renderMarkdownSync(markdown)
  }
}

/**
 * Synchronous fallback renderer (same parser as the service worker).
 * Used when the service worker is unavailable.
 */
export function renderMarkdownSync(markdown: string): string {
  if (!markdown) return ""

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  function parseInline(text: string): string {
    text = text.replace(/`([^`]+)`/g, (_: string, code: string) => `<code>${escapeHtml(code)}</code>`)
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g, (_: string, alt: string, src: string, title?: string) => {
      const t = title ? ` title="${escapeHtml(title)}"` : ""
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${t} />`
    })
    text = text.replace(/\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g, (_: string, label: string, href: string, title?: string) => {
      const t = title ? ` title="${escapeHtml(title)}"` : ""
      return `<a href="${escapeHtml(href)}"${t} target="_blank" rel="noopener noreferrer">${parseInline(label)}</a>`
    })
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    text = text.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    text = text.replace(/__(.+?)__/g, "<strong>$1</strong>")
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>")
    text = text.replace(/_(.+?)_/g, "<em>$1</em>")
    text = text.replace(/~~(.+?)~~/g, "<del>$1</del>")
    text = text.replace(/  \n/g, "<br/>")
    return text
  }

  function parseTable(tableLines: string[]): string {
    if (tableLines.length < 2) return ""
    const parseRow = (line: string) =>
      line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim())
    const headers = parseRow(tableLines[0])
    const alignments = parseRow(tableLines[1] || "").map((sep) => {
      if (sep.startsWith(":") && sep.endsWith(":")) return "center"
      if (sep.endsWith(":")) return "right"
      return "left"
    })
    let html = "<table><thead><tr>"
    headers.forEach((h, i) => {
      const align = alignments[i] ? ` style="text-align:${alignments[i]}"` : ""
      html += `<th${align}>${parseInline(h)}</th>`
    })
    html += "</tr></thead><tbody>"
    for (let i = 2; i < tableLines.length; i++) {
      const cells = parseRow(tableLines[i])
      html += "<tr>"
      cells.forEach((cell, j) => {
        const align = alignments[j] ? ` style="text-align:${alignments[j]}"` : ""
        html += `<td${align}>${parseInline(cell)}</td>`
      })
      html += "</tr>"
    }
    html += "</tbody></table>"
    return html
  }

  function render(md: string): string {
    const lines = md.split("\n")
    const blocks: string[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      if (line.match(/^```/)) {
        const lang = line.slice(3).trim()
        const codeLines: string[] = []
        i++
        while (i < lines.length && !lines[i].match(/^```\s*$/)) {
          codeLines.push(escapeHtml(lines[i]))
          i++
        }
        i++
        const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : ""
        blocks.push(`<pre><code${langAttr}>${codeLines.join("\n")}</code></pre>`)
        continue
      }

      if (line.match(/^(\*{3,}|-{3,}|_{3,})\s*$/)) {
        blocks.push("<hr/>")
        i++
        continue
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        blocks.push(`<h${level}>${parseInline(headingMatch[2])}</h${level}>`)
        i++
        continue
      }

      if (line.includes("|") && i + 1 < lines.length && lines[i + 1].match(/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/)) {
        const tableLines: string[] = []
        while (i < lines.length && lines[i].includes("|")) {
          tableLines.push(lines[i])
          i++
        }
        blocks.push(parseTable(tableLines))
        continue
      }

      if (line.match(/^>\s?/)) {
        const quoteLines: string[] = []
        while (i < lines.length && lines[i].match(/^>\s?/)) {
          quoteLines.push(lines[i].replace(/^>\s?/, ""))
          i++
        }
        blocks.push(`<blockquote>${render(quoteLines.join("\n"))}</blockquote>`)
        continue
      }

      if (line.match(/^(\s*)([*+-])\s/)) {
        const listItems: string[] = []
        while (i < lines.length && lines[i].match(/^(\s*)([*+-])\s/)) {
          const content = lines[i].replace(/^(\s*)[*+-]\s/, "")
          const taskMatch = content.match(/^\[([ xX])\]\s(.*)$/)
          if (taskMatch) {
            const checked = taskMatch[1] !== " " ? " checked disabled" : " disabled"
            listItems.push(`<input type="checkbox"${checked} /> ${parseInline(taskMatch[2])}`)
          } else {
            listItems.push(parseInline(content))
          }
          i++
        }
        blocks.push("<ul>" + listItems.map((item) => `<li>${item}</li>`).join("") + "</ul>")
        continue
      }

      if (line.match(/^(\s*)\d+\.\s/)) {
        const listItems: string[] = []
        while (i < lines.length && lines[i].match(/^(\s*)\d+\.\s/)) {
          const content = lines[i].replace(/^(\s*)\d+\.\s/, "")
          listItems.push(parseInline(content))
          i++
        }
        blocks.push("<ol>" + listItems.map((item) => `<li>${item}</li>`).join("") + "</ol>")
        continue
      }

      if (line.trim() === "") {
        i++
        continue
      }

      const paraLines: string[] = []
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].match(/^(#{1,6}\s|```|>\s?|(\s*)[*+-]\s|(\s*)\d+\.\s|(\*{3,}|-{3,}|_{3,})\s*$)/)) {
        paraLines.push(lines[i])
        i++
      }
      if (paraLines.length > 0) {
        blocks.push(`<p>${parseInline(paraLines.join("\n"))}</p>`)
      }
    }

    return blocks.join("\n")
  }

  return render(markdown)
}

/**
 * Check if the service worker is ready.
 */
export function isServiceWorkerReady(): boolean {
  return sw !== null && sw.state === "activated"
}
