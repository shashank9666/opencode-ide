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
  const [seed] = createSignal(Math.floor(Math.random() * 999999))

  const generate = async () => {
    const text = prompt().trim()
    if (!text || generating()) return
    setGenerating(true)
    setPreview(null)
    setError(null)

    try {
      const encoded = encodeURIComponent(text)
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&seed=${seed()}&nologo=true&model=flux`

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
    const name = `generated-${Date.now()}.png`
    props.onAdd({
      type: "image",
      id: uuid(),
      filename: name,
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
            style={{
              background: "linear-gradient(135deg, hsl(280,80%,60%) 0%, hsl(220,80%,60%) 100%)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L13.5 8.5L20 7L15.5 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L8.5 12L4 7L10.5 8.5L12 2Z"
                fill="white"
              />
            </svg>
          </div>
          <span
            class="text-12-medium"
            style={{ color: "hsl(260,60%,90%)" }}
          >
            Image Generation
          </span>
        </div>
        <button
          type="button"
          onClick={props.onClose}
          class="size-5 rounded flex items-center justify-center transition-all duration-150"
          style={{ color: "hsl(260,30%,60%)" }}
          aria-label="Close image generation"
        >
          <Icon name="close" size="small" />
        </button>
      </div>

      {/* Body */}
      <div class="p-3 flex flex-col gap-3">
        {/* Prompt input row */}
        <div class="flex items-center gap-2">
          <div
            class="flex-1 flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: "hsl(260,20%,14%)",
              border: "1px solid hsl(260,30%,25%)",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: "hsl(260,50%,60%)", "flex-shrink": "0" }}
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <input
              type="text"
              value={prompt()}
              onInput={(e) => setPrompt(e.currentTarget.value)}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === "Enter") { e.preventDefault(); void generate() }
              }}
              placeholder="Describe the image you want to generate..."
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
              background: generating()
                ? "hsl(260,40%,30%)"
                : "linear-gradient(135deg, hsl(280,80%,60%) 0%, hsl(220,80%,60%) 100%)",
              color: "white",
              "box-shadow": generating() ? "none" : "0 2px 8px hsl(260,60%,40%,0.5)",
            }}
          >
            <Show
              when={!generating()}
              fallback={
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    animation: "spin 1s linear infinite",
                    color: "white",
                  }}
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" stroke-dasharray="40 20" />
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

        {/* Loader / Preview area */}
        <Show when={generating()}>
          <ImageGenerationLoader />
        </Show>

        <Show when={error()}>
          <div
            class="rounded-lg px-3 py-2 text-12-regular"
            style={{
              background: "hsl(0,40%,15%)",
              border: "1px solid hsl(0,50%,30%)",
              color: "hsl(0,70%,75%)",
            }}
          >
            ⚠ {error()}
          </div>
        </Show>

        <Show when={preview() && !generating()}>
          <div class="flex gap-3 items-start">
            {/* Preview */}
            <div
              class="relative rounded-lg overflow-hidden"
              style={{
                width: "120px",
                height: "120px",
                border: "1px solid hsl(260,40%,30%)",
                "box-shadow": "0 4px 16px rgba(0,0,0,0.4)",
                "flex-shrink": "0",
              }}
            >
              <img
                src={preview()!}
                alt="Generated image"
                style={{ width: "100%", height: "100%", "object-fit": "cover" }}
              />
            </div>
            {/* Actions */}
            <div class="flex flex-col gap-2 flex-1">
              <p class="text-11-regular" style={{ color: "hsl(260,30%,60%)" }}>
                Image generated successfully
              </p>
              <div class="flex gap-2">
                <button
                  type="button"
                  onClick={addToPrompt}
                  class="flex-1 h-7 px-3 rounded-lg text-12-medium flex items-center justify-center gap-1.5 transition-all duration-150"
                  style={{
                    background: "linear-gradient(135deg, hsl(280,80%,60%) 0%, hsl(220,80%,60%) 100%)",
                    color: "white",
                    "box-shadow": "0 2px 8px hsl(260,60%,40%,0.4)",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  Use Image
                </button>
                <button
                  type="button"
                  onClick={generate}
                  class="h-7 px-3 rounded-lg text-12-medium flex items-center justify-center gap-1.5 transition-all duration-150"
                  style={{
                    background: "hsl(260,20%,18%)",
                    border: "1px solid hsl(260,30%,30%)",
                    color: "hsl(260,30%,70%)",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15.5-4.5M20 15a9 9 0 0 1-15.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        </Show>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes img-gen-pulse {
          0%, 100% { opacity: 0.4; transform: scaleX(1); }
          50% { opacity: 1; transform: scaleX(1.02); }
        }
        @keyframes img-gen-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes img-gen-float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.7; }
          50% { transform: translateY(-6px) scale(1.08); opacity: 1; }
        }
        @keyframes img-gen-glow {
          0%, 100% { box-shadow: 0 0 12px hsl(280,80%,60%,0.3), 0 0 24px hsl(220,80%,60%,0.15); }
          50% { box-shadow: 0 0 20px hsl(280,80%,60%,0.6), 0 0 40px hsl(220,80%,60%,0.3); }
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
        height: "120px",
        background: "hsl(260,20%,10%)",
        border: "1px solid hsl(260,40%,22%)",
        animation: "img-gen-glow 2s ease-in-out infinite",
      }}
    >
      {/* Shimmer overlay */}
      <div
        class="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, hsl(260,60%,60%,0.06) 50%, transparent 100%)",
          animation: "img-gen-shimmer 1.8s ease-in-out infinite",
        }}
      />

      {/* Noise texture via SVG */}
      <div
        class="absolute inset-0 opacity-[0.04]"
        style={{
          "background-image": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          "background-size": "150px",
        }}
      />

      {/* Animated gradient blobs */}
      <div class="absolute inset-0 flex items-center justify-center">
        <div
          style={{
            width: "90px",
            height: "90px",
            "border-radius": "50%",
            background: "radial-gradient(circle, hsl(280,80%,60%,0.25) 0%, transparent 70%)",
            animation: "img-gen-float 2.2s ease-in-out infinite",
          }}
        />
      </div>
      <div class="absolute inset-0 flex items-center justify-center" style={{ transform: "translateX(-20px)" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            "border-radius": "50%",
            background: "radial-gradient(circle, hsl(220,80%,65%,0.2) 0%, transparent 70%)",
            animation: "img-gen-float 2.8s ease-in-out infinite 0.4s",
          }}
        />
      </div>
      <div class="absolute inset-0 flex items-center justify-center" style={{ transform: "translateX(20px)" }}>
        <div
          style={{
            width: "50px",
            height: "50px",
            "border-radius": "50%",
            background: "radial-gradient(circle, hsl(310,80%,65%,0.18) 0%, transparent 70%)",
            animation: "img-gen-float 3s ease-in-out infinite 0.8s",
          }}
        />
      </div>

      {/* Center icon */}
      <div class="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div
          style={{
            width: "32px",
            height: "32px",
            "border-radius": "10px",
            background: "linear-gradient(135deg, hsl(280,80%,60%) 0%, hsl(220,80%,60%) 100%)",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            animation: "img-gen-float 2s ease-in-out infinite 0.2s",
            "box-shadow": "0 4px 16px hsl(260,80%,60%,0.4)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L13.5 8.5L20 7L15.5 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L8.5 12L4 7L10.5 8.5L12 2Z" fill="white" />
          </svg>
        </div>

        {/* Loading bar */}
        <div
          class="relative overflow-hidden rounded-full"
          style={{
            width: "100px",
            height: "3px",
            background: "hsl(260,30%,20%)",
          }}
        >
          <div
            class="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: "linear-gradient(90deg, hsl(280,80%,60%) 0%, hsl(220,80%,70%) 100%)",
              animation: "img-gen-pulse 1.4s ease-in-out infinite",
              width: "60%",
            }}
          />
        </div>

        <span
          class="text-10-regular"
          style={{ color: "hsl(260,30%,55%)", "letter-spacing": "0.08em" }}
        >
          GENERATING IMAGE...
        </span>
      </div>
    </div>
  )
}
