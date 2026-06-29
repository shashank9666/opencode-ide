import { Effect, Schema } from "effect"
import { NonNegativeInt } from "@opencode-ai/core/schema"
import * as Tool from "./tool"
import { ReadTool } from "./read"

const DESCRIPTION = "View the contents of a file from the local filesystem. StartLine and EndLine are 1-indexed."

export const Parameters = Schema.Struct({
  AbsolutePath: Schema.String.annotate({ description: "Path to file to view. Must be an absolute path." }),
  StartLine: Schema.optional(NonNegativeInt).annotate({ description: "Optional. Startline to view, 1-indexed as usual, inclusive." }),
  EndLine: Schema.optional(NonNegativeInt).annotate({ description: "Optional. Endline to view, 1-indexed as usual, inclusive." }),
})

import { FSUtil } from "@opencode-ai/core/fs-util"
import { Instruction } from "../session/instruction"
import { LSP } from "@/lsp/lsp"
import { Scope } from "effect"
import * as Truncate from "./truncate"
import { Agent } from "@/agent/agent"

export const ViewFileTool = Tool.define<
  typeof Parameters,
  any,
  FSUtil.Service | Instruction.Service | LSP.Service | Scope.Scope | Truncate.Service | Agent.Service
>(
  "view_file",
  Effect.gen(function* () {
    const readInfo = yield* ReadTool
    const readInit = yield* readInfo.init()

    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params, ctx) => {
        const offset = params.StartLine ?? 1
        const limit = params.EndLine ? params.EndLine - offset + 1 : 800
        
        return readInit.execute({ filePath: params.AbsolutePath, offset, limit }, ctx)
      }
    }
  })
)
