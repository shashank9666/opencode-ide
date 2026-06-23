import { createSignal, createEffect, onCleanup, Show, on } from "solid-js"
import { renderMarkdown, renderMarkdownSync, isServiceWorkerReady } from "@/utils/markdown-sw"

export function MarkdownPreviewPanel(props: { content: string; visible: boolean }) {
  const [expanded, setExpanded] = createSignal(true)
  const [html, setHtml] = createSignal("")
  const [rendering, setRendering] = createSignal(false)
  const [renderMethod, setRenderMethod] = createSignal<"sw" | "sync">("sync")

  // Render markdown via service worker (off main thread)
  createEffect(on(() => props.content, (content) => {
    if (!content || !expanded()) {
      setHtml(content ? renderMarkdownSync(content) : "")
      return
    }

    let cancelled = false

    const doRender = async () => {
      setRendering(true)
      try {
        const result = await renderMarkdown(content)
        if (!cancelled) {
          setHtml(result)
          setRenderMethod(isServiceWorkerReady() ? "sw" : "sync")
        }
      } catch {
        // Fallback to sync render
        if (!cancelled) {
          setHtml(renderMarkdownSync(content))
          setRenderMethod("sync")
        }
      } finally {
        if (!cancelled) setRendering(false)
      }
    }

    doRender()

    onCleanup(() => { cancelled = true })
  }))

  // Re-render when toggling expanded
  createEffect(on(expanded, (isExpanded) => {
    if (!isExpanded || !props.content) return
    // Re-render when expanding to ensure freshness
    renderMarkdown(props.content).then((result) => setHtml(result)).catch(() => {
      setHtml(renderMarkdownSync(props.content))
    })
  }))

  return (
    <Show when={props.visible}>
      <div class="border-l border-border-base bg-background-base overflow-y-auto min-w-0 flex-1">
        <div class="flex items-center justify-between px-3 py-1.5 border-b border-border-base bg-surface-base shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-12-medium text-text-weak">Preview</span>
            <Show when={rendering()}>
              <span class="text-11-regular text-text-weaker animate-pulse">Rendering...</span>
            </Show>
            <Show when={!rendering() && renderMethod() === "sw"}>
              <span class="text-10-regular text-text-success-base bg-text-success-base/10 px-1.5 py-0.5 rounded" title="Rendered off-main-thread via Service Worker">
                SW
              </span>
            </Show>
          </div>
          <button
            type="button"
            class="text-12-regular text-text-weak hover:text-text-strong px-1.5 py-0.5 rounded hover:bg-surface-raised-base-hover transition-colors"
            onClick={() => setExpanded((p) => !p)}
          >
            {expanded() ? "Collapse" : "Expand"}
          </button>
        </div>
        <Show when={expanded()}>
          <div
            class="p-4 prose prose-sm max-w-none text-text-strong
              [&_pre]:bg-surface-base [&_pre]:border [&_pre]:border-border-base [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:overflow-x-auto
              [&_code]:text-12-regular [&_code]:bg-surface-raised-base [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
              [&_h1]:text-18-medium [&_h2]:text-16-medium [&_h3]:text-14-medium
              [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:mt-4 [&_h3]:mb-2
              [&_a]:text-accent-base [&_a]:underline [&_a]:hover:text-accent-base-hover
              [&_blockquote]:border-l-2 [&_blockquote]:border-accent-base [&_blockquote]:pl-3 [&_blockquote]:text-text-weak [&_blockquote]:italic
              [&_img]:rounded-md [&_img]:max-w-full [&_img]:my-3
              [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
              [&_li]:my-1
              [&_hr]:border-border-base [&_hr]:my-6
              [&_table]:w-full [&_table]:my-3 [&_th]:text-left [&_th]:p-2 [&_th]:bg-surface-base [&_th]:border [&_th]:border-border-base
              [&_td]:p-2 [&_td]:border [&_td]:border-border-base
              [&_del]:text-text-weaker
              [&_input]:mr-2"
            innerHTML={html()}
          />
        </Show>
      </div>
    </Show>
  )
}
