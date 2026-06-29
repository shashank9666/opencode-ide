import { Effect, Context, Layer } from "effect"
import { BrowserSubagentTools } from "./tools"
import { antigravityInjectionScript } from "./injection"

export interface Interface {
  readonly run: (task: string, startUrl: string) => Effect.Effect<void, Error>
}

export class BrowserSubagentLoop extends Context.Service<BrowserSubagentLoop, Interface>()("@opencode/BrowserSubagentLoop") {}

export const layer = Layer.effect(
  BrowserSubagentLoop,
  Effect.gen(function* () {
    const tools = yield* BrowserSubagentTools

    return BrowserSubagentLoop.of({
      run: (task: string, startUrl: string) => Effect.gen(function* () {
        yield* Effect.logInfo(`[Browser Loop] Starting task: ${task} at ${startUrl}`)
        
        // Example execution flow utilizing tools
        yield* tools.navigate.init().pipe(Effect.flatMap(def => def.execute({ url: startUrl }, null as any)))
        
        // Mocking page.addInitScript injection
        yield* Effect.logInfo(`[Browser Loop] Injected Antigravity UI scripts: ${antigravityInjectionScript.substring(0, 50)}...`)
        
        // Mocking page.evaluate to show the modal
        yield* Effect.logInfo(`[Browser Loop] Executing: window.__antigravityUI.showModal('Executing: ${task}')`)
        
        yield* Effect.sleep("2 seconds")
        
        // This is a stub for the LLM tool choice loop
        yield* Effect.logInfo(`[Browser Loop] Finished task: ${task}`)
      })
    })
  })
)
