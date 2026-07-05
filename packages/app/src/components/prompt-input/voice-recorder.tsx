import { createSignal, onCleanup, onMount, Show } from "solid-js"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { showToast } from "@/utils/toast"
import { useDialog } from "@opencode-ai/ui/context/dialog"

// Polyfill for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function VoiceRecorder(props: {
  onTranscriptionComplete: (text: string, autoSubmit?: boolean) => void
}) {
  const [recording, setRecording] = createSignal(false)
  const [transcript, setTranscript] = createSignal("")
  const [interim, setInterim] = createSignal("")
  const [recognition, setRecognition] = createSignal<any>(null)
  
  const dialog = useDialog()

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      showToast({ title: "Unsupported Browser", description: "Voice recognition is not supported in this browser." })
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = "en-US"

    rec.onresult = (event: any) => {
      let finalStr = ""
      let interimStr = ""

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript
        } else {
          interimStr += event.results[i][0].transcript
        }
      }

      if (finalStr) {
        setTranscript((prev) => prev ? prev + " " + finalStr.trim() : finalStr.trim())
      }
      setInterim(interimStr)
    }

    rec.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        console.error("Speech recognition error:", event.error)
        showToast({ title: "Recording Error", description: `Error: ${event.error}` })
        stopRecording(false)
      }
    }

    rec.onend = () => {
      if (recording()) {
        // Automatically restart if it stops unexpectedly while we still want to record
        try {
          rec.start()
        } catch (e) {
          setRecording(false)
        }
      }
    }

    setRecognition(rec)
    try {
      rec.start()
      setRecording(true)
      setTranscript("")
      setInterim("")
    } catch (e) {
      console.error(e)
    }
  }

  const stopRecording = (submit: boolean) => {
    const rec = recognition()
    if (rec) {
      rec.onend = null // Prevent auto-restart
      rec.stop()
    }
    setRecording(false)
    setRecognition(null)
    
    if (submit) {
      const fullText = (transcript() + " " + interim()).trim()
      if (fullText) {
        props.onTranscriptionComplete(fullText, true)
        dialog.close()
      } else {
        showToast({ title: "Empty Recording", description: "No speech was detected." })
        dialog.close()
      }
    }
  }

  onCleanup(() => {
    const rec = recognition()
    if (rec) {
      rec.onend = null
      rec.stop()
    }
  })

  // Start automatically when opened
  onMount(() => {
    startRecording()
  })

  return (
    <Dialog 
      title="Conversational Voice Mode" 
      description="Speak naturally to transcribe your prompt." 
      class="pointer-events-auto w-full max-w-[500px] border border-border-base bg-surface-base p-6 shadow-[var(--v2-elevation-modal)] rounded-2xl"
    >
      <div class="flex flex-col items-center justify-center py-6 min-h-[250px]">
        <Show when={recording()} fallback={
          <div class="flex flex-col items-center gap-4">
            <Button size="large" variant="primary" class="rounded-full size-16 p-0 flex items-center justify-center" onClick={startRecording}>
              <Icon name="play" class="size-6 text-white ml-1" />
            </Button>
            <span class="text-text-muted text-13-regular">Click to start listening</span>
          </div>
        }>
          <div class="flex flex-col w-full h-full justify-between items-center gap-6">
            
            {/* Live Text Area */}
            <div class="w-full flex-1 flex flex-col justify-end bg-surface-raised-base rounded-xl p-4 overflow-hidden border border-border-muted min-h-[120px]">
              <p class="text-16-medium text-text-strong break-words leading-relaxed">
                {transcript()}
                <span class="text-text-muted transition-colors duration-200">{transcript() ? " " + interim() : interim()}</span>
                <span class="animate-pulse text-brand-base">_</span>
              </p>
              <Show when={!transcript() && !interim()}>
                <p class="text-text-muted text-15-regular text-center my-auto animate-pulse">Listening...</p>
              </Show>
            </div>

            {/* Controls */}
            <div class="flex items-center gap-6 w-full justify-center relative">
              <Button size="normal" variant="ghost" class="absolute left-0 text-text-muted hover:text-red-500" onClick={() => {
                stopRecording(false)
                dialog.close()
              }}>
                Cancel
              </Button>
              
              <div class="relative flex items-center justify-center size-20">
                <div class="absolute inset-0 bg-brand-base/20 rounded-full animate-ping" style={{ "animation-duration": "2s" }} />
                <div class="absolute inset-2 bg-brand-base/30 rounded-full animate-pulse" />
                <Button 
                  size="large" 
                  variant="primary" 
                  class="relative z-10 rounded-full size-16 p-0 flex items-center justify-center shadow-lg transition-transform hover:scale-105" 
                  onClick={() => stopRecording(true)}
                  title="Stop & Send"
                >
                  <Icon name="stop" class="size-6 text-white" />
                </Button>
              </div>

              <div class="absolute right-0 text-12-medium text-brand-base animate-pulse">
                Recording
              </div>
            </div>
            
          </div>
        </Show>
      </div>
    </Dialog>
  )
}
