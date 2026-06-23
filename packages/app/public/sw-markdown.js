/**
 * Markdown Preview Service Worker
 *
 * Off-main-thread markdown → HTML conversion.
 * Receives markdown text via postMessage, converts it to HTML using
 * a lightweight parser, and posts the result back.
 *
 * Protocol:
 *   Request:  { type: "render", id: string, markdown: string, options?: RenderOptions }
 *   Response: { type: "rendered", id: string, html: string }
 *   Ping:     { type: "ping" } → { type: "pong" }
 */

const VERSION = "1.0.0"

// ── Lightweight Markdown Parser ──
// Handles: headings, bold, italic, inline code, fenced code blocks,
// links, images, blockquotes, unordered/ordered lists, tables,
// horizontal rules, strikethrough, task lists, and paragraphs.

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function parseInline(text) {
  // Inline code (must come first to prevent inner parsing)
  text = text.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`)

  // Images
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g, (_, alt, src, title) => {
    const t = title ? ` title="${escapeHtml(title)}"` : ""
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${t} />`
  })

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g, (_, label, href, title) => {
    const t = title ? ` title="${escapeHtml(title)}"` : ""
    return `<a href="${escapeHtml(href)}"${t} target="_blank" rel="noopener noreferrer">${parseInline(label)}</a>`
  })

  // Bold + Italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
  text = text.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")

  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>")

  // Italic
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>")
  text = text.replace(/_(.+?)_/g, "<em>$1</em>")

  // Strikethrough
  text = text.replace(/~~(.+?)~~/g, "<del>$1</del>")

  // Line breaks
  text = text.replace(/  \n/g, "<br/>")

  return text
}

function parseTable(lines) {
  if (lines.length < 2) return ""

  const parseRow = (line) =>
    line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim())

  const headers = parseRow(lines[0])
  // Line 1 is the separator (---|:--- etc.) — skip it
  const alignments = parseRow(lines[1] || "").map((sep) => {
    if (sep.startsWith(":") && sep.endsWith(":")) return "center"
    if (sep.endsWith(":")) return "right"
    return "left"
  })

  let html = "<table>"

  // Header
  html += "<thead><tr>"
  headers.forEach((h, i) => {
    const align = alignments[i] ? ` style="text-align:${alignments[i]}"` : ""
    html += `<th${align}>${parseInline(h)}</th>`
  })
  html += "</tr></thead>"

  // Body
  html += "<tbody>"
  for (let i = 2; i < lines.length; i++) {
    const cells = parseRow(lines[i])
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

function parseMarkdown(md) {
  if (!md) return ""

  const lines = md.split("\n")
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.match(/^```/)) {
      const lang = line.slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].match(/^```\s*$/)) {
        codeLines.push(escapeHtml(lines[i]))
        i++
      }
      i++ // skip closing fence
      const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : ""
      blocks.push(`<pre><code${langAttr}>${codeLines.join("\n")}</code></pre>`)
      continue
    }

    // Horizontal rule
    if (line.match(/^(\*{3,}|-{3,}|_{3,})\s*$/)) {
      blocks.push("<hr/>")
      i++
      continue
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      blocks.push(`<h${level}>${parseInline(headingMatch[2])}</h${level}>`)
      i++
      continue
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].match(/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/)) {
      const tableLines = []
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i])
        i++
      }
      blocks.push(parseTable(tableLines))
      continue
    }

    // Blockquote
    if (line.match(/^>\s?/)) {
      const quoteLines = []
      while (i < lines.length && lines[i].match(/^>\s?/)) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""))
        i++
      }
      blocks.push(`<blockquote>${parseMarkdown(quoteLines.join("\n"))}</blockquote>`)
      continue
    }

    // Unordered list
    if (line.match(/^(\s*)([*+-])\s/)) {
      const listItems = []
      while (i < lines.length && lines[i].match(/^(\s*)([*+-])\s/)) {
        const indent = lines[i].match(/^(\s*)/)[1].length
        const content = lines[i].replace(/^(\s*)[*+-]\s/, "")

        // Task list
        const taskMatch = content.match(/^\[([ xX])\]\s(.*)$/)
        if (taskMatch) {
          const checked = taskMatch[1] !== " " ? " checked disabled" : " disabled"
          listItems.push({ indent, html: `<input type="checkbox"${checked} /> ${parseInline(taskMatch[2])}` })
        } else {
          listItems.push({ indent, html: parseInline(content) })
        }
        i++
      }
      blocks.push("<ul>" + listItems.map((item) => `<li>${item.html}</li>`).join("") + "</ul>")
      continue
    }

    // Ordered list
    if (line.match(/^(\s*)\d+\.\s/)) {
      const listItems = []
      while (i < lines.length && lines[i].match(/^(\s*)\d+\.\s/)) {
        const content = lines[i].replace(/^(\s*)\d+\.\s/, "")
        listItems.push(parseInline(content))
        i++
      }
      blocks.push("<ol>" + listItems.map((item) => `<li>${item}</li>`).join("") + "</ol>")
      continue
    }

    // Blank line
    if (line.trim() === "") {
      i++
      continue
    }

    // Paragraph — collect consecutive non-blank lines
    const paraLines = []
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

// ── Service Worker Message Handler ──

self.addEventListener("message", (event) => {
  const { data } = event
  if (!data || !data.type) return

  switch (data.type) {
    case "ping":
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "pong", version: VERSION })
        })
      })
      break

    case "render": {
      const { id, markdown, options } = data
      try {
        const html = parseMarkdown(markdown || "")
        // Post back to all clients (the sender will match by id)
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: "rendered", id, html })
          })
        })
      } catch (err) {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "rendered",
              id,
              html: `<p style="color:red">Render error: ${escapeHtml(String(err))}</p>`,
              error: true,
            })
          })
        })
      }
      break
    }
  }
})

// Activate immediately — skip waiting
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})
