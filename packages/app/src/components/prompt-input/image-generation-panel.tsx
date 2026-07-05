import { createSignal, Show } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { uuid } from "@/utils/uuid"
import type { ImageAttachmentPart } from "@/context/prompt"

type Props = {
  onAdd: (attachment: ImageAttachmentPart) => void
  onClose: () => void
}

export function ImageGenerationPanel(props: Props) {
  const [prompt, setPrompt] = createSignal("")
  const [generating, setGenerating] = createSignal(false)
  const [preview, setPreview] = createSignal<string | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  const generate = async () => {
    const text = prompt().trim()
    if (!text || generating()) return
    setGenerating(true)
    setPreview(null)
    setError(null)
    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=512&height=512&nologo=true&model=flux`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      setPreview(dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed")
    } finally {
      setGenerating(false)
    }
  }

  const addToPrompt = () => {
    const url = preview()
    if (!url) return
    props.onAdd({
      type: "image",
      id: uuid(),
      filename: `generated-${Date.now()}.png`,
      mime: "image/png",
      dataUrl: url,
    })
    props.onClose()
  }

  return (
    <div
      class="w-full rounded-xl overflow-hidden border"
      style={{
        background: "linear-gradient(135deg, hsl(260,30%,10%) 0%, hsl(220,30%,8%) 100%)",
        border: "1px solid hsl(260,40%,30%)",
        "box-shadow": "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 hsl(260,40%,30%)",
      }}
    >
      {/* Header */}
      <div
        class="flex items-center justify-between px-3 py-2"
        style={{
          background: "linear-gradient(90deg, hsl(260,50%,20%) 0%, hsl(220,50%,18%) 100%)",
          "border-bottom": "1px solid hsl(260,40%,28%)",
        }}
      >
        <div class="flex items-center gap-2">
          <div
            class="size-5 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(280,80%,60%) 0%, hsl(220,80%,60%) 100%)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.5 8.5L20 7L15.5 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L8.5 12L4 7L10.5 8.5L12 2Z" fill="white" />
            </svg>
          </div>
          <span class="text-12-medium" style={{ color: "hsl(260,60%,90%)" }}>
            Image Generation
          </span>
        </div>
        <button
          type="button"
          onClick={props.onClose}
          class="size-5 rounded flex items-center justify-center"
          style={{ color: "hsl(260,30%,60%)" }}
          aria-label="Close image generation"
        >
          <Icon name="close" size="small" />
        </button>
      </div>

      {/* Body */}
      <div class="p-3 flex flex-col gap-3">
        {/* Input row */}
        <div class="flex items-center gap-2">
          <div
            class="flex-1 flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "hsl(260,20%,14%)", border: "1px solid hsl(260,30%,25%)" }}
          >
            <input
              type="text"
              value={prompt()}
              onInput={(e) => setPrompt(e.currentTarget.value)}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === "Enter") { e.preventDefault(); void generate() }
              }}
              placeholder="Describe the image..."
              class="flex-1 bg-transparent outline-none text-12-regular"
              style={{ color: "hsl(260,20%,90%)", "caret-color": "hsl(280,80%,70%)" }}
            />
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={generating() || !prompt().trim()}
            class="shrink-0 h-8 px-3 rounded-lg text-12-medium flex items-center gap-1.5 transition-all duration-150 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, hsl(280,80%,60%) 0%, hsl(220,80%,60%) 100%)",
              color: "white",
              "box-shadow": "0 2px 8px hsl(260,60%,40%,0.5)",
            }}
          >
            <Show
              when={!generating()}
              fallback={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ animation: "img-gen-spin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2.5" stroke-dasharray="40 20" />
                </svg>
              }
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.5 8.5L20 7L15.5 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L8.5 12L4 7L10.5 8.5L12 2Z" fill="white" />
              </svg>
            </Show>
            {generating() ? "Generating..." : "Generate"}
          </button>
        </div>

        <Show when={generating()}>
          <ImageGenerationLoader />
        </Show>

        <Show when={error()}>
          <div
            class="rounded-lg px-3 py-2 text-12-regular"
            style={{ background: "hsl(0,40%,15%)", border: "1px solid hsl(0,50%,30%)", color: "hsl(0,70%,75%)" }}
          >
            ⚠ {error()}
          </div>
        </Show>

        <Show when={preview() && !generating()}>
          <div class="flex gap-3 items-start">
            <div
              class="relative rounded-lg overflow-hidden"
              style={{ width: "120px", height: "120px", border: "1px solid hsl(260,40%,30%)", "flex-shrink": "0" }}
            >
              <img src={preview()!} alt="Generated" style={{ width: "100%", height: "100%", "object-fit": "cover" }} />
            </div>
            <div class="flex flex-col gap-2 flex-1 pt-1">
              <div class="flex gap-2">
                <button
                  type="button"
                  onClick={addToPrompt}
                  class="flex-1 h-7 px-3 rounded-lg text-12-medium flex items-center justify-center gap-1.5"
                  style={{
                    background: "linear-gradient(135deg, hsl(280,80%,60%) 0%, hsl(220,80%,60%) 100%)",
                    color: "white",
                  }}
                >
                  Use Image
                </button>
                <button
                  type="button"
                  onClick={generate}
                  class="h-7 px-3 rounded-lg text-12-medium flex items-center justify-center"
                  style={{ background: "hsl(260,20%,18%)", border: "1px solid hsl(260,30%,30%)", color: "hsl(260,30%,70%)" }}
                >
                  Again
                </button>
              </div>
            </div>
          </div>
        </Show>
      </div>

      <style>{`
        @keyframes img-gen-spin { to { transform: rotate(360deg); } }
        @keyframes img-gen-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes img-gen-float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.7; }
          50% { transform: translateY(-6px) scale(1.08); opacity: 1; }
        }
        @keyframes img-gen-pulse {
          0%, 100% { opacity: 0.4; } 50% { opacity: 1; }
        }
        @keyframes img-gen-glow {
          0%, 100% { box-shadow: 0 0 12px hsl(280,80%,60%,0.3); }
          50% { box-shadow: 0 0 24px hsl(280,80%,60%,0.6); }
        }
      `}</style>
    </div>
  )
}

function ImageGenerationLoader() {
  return (
    <div
      class="rounded-xl overflow-hidden relative"
      style={{
        height: "110px",
        background: "hsl(260,20%,10%)",
        border: "1px solid hsl(260,40%,22%)",
        animation: "img-gen-glow 2s ease-in-out infinite",
      }}
    >
      <div
        class="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, hsl(260,60%,60%,0.06) 50%, transparent 100%)",
          animation: "img-gen-shimmer 1.8s ease-in-out infinite",
        }}
      />
      <div class="absolute inset-0 flex items-center justify-center">
        <div style={{ width: "80px", height: "80px", "border-radius": "50%", background: "radial-gradient(circle, hsl(280,80%,60%,0.2) 0%, transparent 70%)", animation: "img-gen-float 2.2s ease-in-out infinite" }} />
      </div>
      <div class="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div
          style={{
            width: "30px", height: "30px", "border-radius": "9px",
            background: "linear-gradient(135deg, hsl(280,80%,60%) 0%, hsl(220,80%,60%) 100%)",
            display: "flex", "align-items": "center", "justify-content": "center",
            animation: "img-gen-float 2s ease-in-out infinite",
            "box-shadow": "0 4px 16px hsl(260,80%,60%,0.4)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L13.5 8.5L20 7L15.5 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L8.5 12L4 7L10.5 8.5L12 2Z" fill="white" />
          </svg>
        </div>
        <div class="relative overflow-hidden rounded-full" style={{ width: "90px", height: "3px", background: "hsl(260,30%,20%)" }}>
          <div
            class="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(90deg, hsl(280,80%,60%), hsl(220,80%,70%))", animation: "img-gen-pulse 1.4s ease-in-out infinite", width: "60%" }}
          />
        </div>
        <span class="text-10-regular" style={{ color: "hsl(260,30%,55%)", "letter-spacing": "0.08em" }}>GENERATING...</span>
      </div>
    </div>
  )
}
