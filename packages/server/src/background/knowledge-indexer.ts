import { Effect, Context, Layer, Schedule } from "effect"
import { FSUtil } from "@opencode-ai/core/fs-util"
import { KnowledgeDaemon } from "@opencode-ai/core/system-context/knowledge"
import * as path from "path"

export interface Interface {
  readonly startDaemon: () => Effect.Effect<void, Error>
}

export class KnowledgeIndexer extends Context.Service<KnowledgeIndexer, Interface>()("@opencode/KnowledgeIndexer") {}

export const layer = Layer.effect(
  KnowledgeIndexer,
  Effect.gen(function* () {
    const fs = yield* FSUtil.Service
    
    return KnowledgeIndexer.of({
      startDaemon: () => Effect.gen(function* () {
        const kiDir = path.join(process.cwd(), ".gemini", "knowledge")
        
        const scan = Effect.gen(function* () {
          const exists = yield* fs.existsSafe(kiDir)
          if (exists) {
            yield* Effect.logInfo(`[KnowledgeDaemon] Scanned Knowledge Items in ${kiDir}`)
            // Parse KIs and index them for system context injection
          }
        })

        // Run indexer loop every 5 minutes
        const task = scan.pipe(
          Effect.repeat(Schedule.spaced("5 minutes")),
          Effect.catchCause((cause) => Effect.logError("KI Daemon error", cause))
        )
        
        // Detach the loop from the current effect scope
        setTimeout(() => Effect.runPromise(task), 0)
      })
    })
  })
)
