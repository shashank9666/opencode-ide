import { createContext, type ParentProps, useContext } from "solid-js"
import { createStore } from "solid-js/store"
import { createSignal } from "solid-js"

export type VerificationStep = "tests" | "linter" | "formatter" | "build" | "browser-test" | "accessibility" | "performance"

export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped"

export interface VerificationStepState {
  status: StepStatus
  output: string
  duration: number | null
}

export interface VerificationState {
  active: boolean
  steps: Record<VerificationStep, VerificationStepState>
  currentStep: VerificationStep | null
}

export type StepRunner = (step: VerificationStep) => Promise<string | undefined>

const initStepState = (): VerificationStepState => ({
  status: "pending",
  output: "",
  duration: null,
})

export const stepOrder: VerificationStep[] = ["tests", "linter", "formatter", "build", "browser-test", "accessibility", "performance"]

const initSteps = (): Record<VerificationStep, VerificationStepState> => ({
  tests: initStepState(),
  linter: initStepState(),
  formatter: initStepState(),
  build: initStepState(),
  "browser-test": initStepState(),
  accessibility: initStepState(),
  performance: initStepState(),
})

function createVerificationState() {
  const [state, setState] = createStore<VerificationState>({
    active: false,
    steps: initSteps(),
    currentStep: null,
  })
  const [active, setActive] = createSignal(false)

  const start = () => {
    setActive(true)
    setState("active", true)
    setState("currentStep", null)
    setState("steps", initSteps())
  }

  const stop = () => {
    setActive(false)
    setState("active", false)
    setState("currentStep", null)
  }

  const skipStep = (step: VerificationStep) => {
    if (state.steps[step].status === "running") return
    setState("steps", step, "status", "skipped")
  }

  const rerunStep = async (step: VerificationStep, runner?: StepRunner) => {
    setState("currentStep", step)
    setState("steps", step, "output", "")
    setState("steps", step, "duration", null)
    setState("steps", step, "status", "running")
    const startTime = performance.now()
    try {
      const output = await runner?.(step)
      setState("steps", step, "output", output ?? "")
      setState("steps", step, "duration", performance.now() - startTime)
      setState("steps", step, "status", "completed")
    } catch (e) {
      setState("steps", step, "output", e instanceof Error ? e.message : String(e))
      setState("steps", step, "duration", performance.now() - startTime)
      setState("steps", step, "status", "failed")
    }
    setState("currentStep", null)
  }

  const runVerification = async (runner?: StepRunner) => {
    start()
    for (const step of stepOrder) {
      if (!active()) break
      setState("currentStep", step)
      setState("steps", step, "status", "running")
      const startTime = performance.now()
      try {
        const output = await runner?.(step)
        setState("steps", step, "output", output ?? "")
        setState("steps", step, "duration", performance.now() - startTime)
        setState("steps", step, "status", "completed")
      } catch (e) {
        setState("steps", step, "output", e instanceof Error ? e.message : String(e))
        setState("steps", step, "duration", performance.now() - startTime)
        setState("steps", step, "status", "failed")
        break
      }
    }
    setState("currentStep", null)
  }

  const results = () => {
    const statuses = stepOrder.map(s => state.steps[s].status)
    return {
      pass: statuses.every(s => s === "completed" || s === "skipped"),
      fail: statuses.some(s => s === "failed"),
      running: statuses.some(s => s === "running"),
      total: stepOrder.length,
      completed: statuses.filter(s => s === "completed" || s === "skipped").length,
    }
  }

  const autoVerify = (runner?: StepRunner) => {
    runVerification(runner)
  }

  return { state, active, start, stop, runVerification, skipStep, rerunStep, results, autoVerify }
}

export type VerificationContextType = ReturnType<typeof createVerificationState>

const VerificationContext = createContext<VerificationContextType>()

export function VerificationProvider(props: ParentProps) {
  return (
    <VerificationContext.Provider value={createVerificationState()}>
      {props.children}
    </VerificationContext.Provider>
  )
}

export function useVerification(): VerificationContextType {
  const ctx = useContext(VerificationContext)
  if (!ctx) throw new Error("useVerification must be used within a VerificationProvider")
  return ctx
}
