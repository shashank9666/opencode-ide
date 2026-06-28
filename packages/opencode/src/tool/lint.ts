import { Effect, Schema, Stream } from "effect"
import * as Tool from "./tool"
import { InstanceState } from "@/effect/instance-state"
import { ChildProcess } from "effect/unstable/process"
import { ChildProcessSpawner } from "effect/unstable/process/ChildProcessSpawner"
import DESCRIPTION from "./lint.txt"
import path from "path"

export const Parameters = Schema.Struct({
  command: Schema.String.annotate({ description: "The linting or formatting command to run (e.g. 'npx eslint --fix file.ts' or 'npx prettier --write file.ts')" }),
})

export const LintTool = Tool.define(
  "lint_fix",
  Effect.gen(function* () {
    const spawner = yield* ChildProcessSpawner
    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const ins = yield* InstanceState.context
          
          yield* ctx.ask({
            permission: "lint",
            patterns: ["*"],
            always: ["*"],
            metadata: { command: params.command },
          })

          const proc = ChildProcess.make(process.platform === "win32" ? "cmd.exe" : "sh", process.platform === "win32" ? ["/c", `cd /D "${ins.directory}" && ${params.command}`] : ["-c", `cd "${ins.directory}" && ${params.command}`])

          const output = yield* spawner.lines(proc).pipe(
            Effect.catch(() => Effect.succeed([] as string[]))
          )
          
          return {
            title: `Ran linter`,
            output: output.join("\n") || "Command completed with no output.",
            metadata: {},
          }
        }).pipe(
          Effect.catch((e) => Effect.succeed({ title: "Error", output: String(e), metadata: {} }))
        ),
    }
  }),
)
