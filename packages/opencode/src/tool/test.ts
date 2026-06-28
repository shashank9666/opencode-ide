import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { InstanceState } from "@/effect/instance-state"
import { ChildProcess } from "effect/unstable/process"
import { ChildProcessSpawner } from "effect/unstable/process/ChildProcessSpawner"
import DESCRIPTION from "./test.txt"

export const Parameters = Schema.Struct({
  command: Schema.String.annotate({ description: "The testing command to run (e.g. 'npm test', 'bun test', 'pytest')" }),
})

export const TestTool = Tool.define(
  "run_tests",
  Effect.gen(function* () {
    const spawner = yield* ChildProcessSpawner
    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const ins = yield* InstanceState.context
          
          yield* ctx.ask({
            permission: "test",
            patterns: ["*"],
            always: ["*"],
            metadata: { command: params.command },
          })

          const proc = ChildProcess.make(process.platform === "win32" ? "cmd.exe" : "sh", process.platform === "win32" ? ["/c", `cd /D "${ins.directory}" && ${params.command}`] : ["-c", `cd "${ins.directory}" && ${params.command}`])

          const outputLines = yield* spawner.lines(proc).pipe(
            Effect.catch(() => Effect.succeed([] as string[]))
          )

          let output = outputLines.join("\n")
          if (output.length > 20000) {
            output = output.substring(0, 10000) + "\n\n... (output truncated) ...\n\n" + output.substring(output.length - 10000)
          }
          
          return {
            title: `Ran tests`,
            output: output || "Command completed with no output.",
            metadata: {},
          }
        }).pipe(
          Effect.catch((e) => Effect.succeed({ title: "Error", output: String(e), metadata: {} }))
        ),
    }
  }),
)
