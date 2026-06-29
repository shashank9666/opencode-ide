import { Schema, Effect, Context, Layer } from "effect"
import * as Tool from "../../tool/tool"

export const ClickToolParams = Schema.Struct({
  selector: Schema.String.annotate({ description: "CSS selector of the element to click" }),
})

export const TypeToolParams = Schema.Struct({
  selector: Schema.String.annotate({ description: "CSS selector of the input element" }),
  text: Schema.String.annotate({ description: "Text to type into the input" }),
})

export const NavigateToolParams = Schema.Struct({
  url: Schema.String.annotate({ description: "URL to navigate to" }),
})

export interface Interface {
  readonly click: Tool.Info<typeof ClickToolParams, any>
  readonly type: Tool.Info<typeof TypeToolParams, any>
  readonly navigate: Tool.Info<typeof NavigateToolParams, any>
}

export class BrowserSubagentTools extends Context.Service<BrowserSubagentTools, Interface>()("@opencode/BrowserSubagentTools") {}

export const layer = Layer.effect(
  BrowserSubagentTools,
  Effect.gen(function* () {
    const click = Tool.define(
      "browser_click",
      Effect.succeed({
        description: "Click an element on the page",
        parameters: ClickToolParams,
        execute: (params: any) => Effect.gen(function* () {
          // 1. Mock: Move cursor smoothly to element
          yield* Effect.logInfo(`[Browser UI] window.__antigravityUI.moveCursorTo(el.x, el.y) for ${params.selector}`)
          yield* Effect.sleep("400 millis")
          
          // 2. Mock: Play click animation
          yield* Effect.logInfo(`[Browser UI] window.__antigravityUI.click()`)
          yield* Effect.sleep("100 millis")
          
          return {
            title: "Browser Action",
            output: `Clicked element ${params.selector}`,
            metadata: {} as any
          }
        }),
      })
    )

    const type = Tool.define(
      "browser_type",
      Effect.succeed({
        description: "Type text into an input field",
        parameters: TypeToolParams,
        execute: (params: any) => Effect.gen(function* () {
          // 1. Mock: Move cursor and click input
          yield* Effect.logInfo(`[Browser UI] window.__antigravityUI.moveCursorTo(el.x, el.y) for ${params.selector}`)
          yield* Effect.sleep("300 millis")
          
          // 2. Mock: Play smooth type animation
          yield* Effect.logInfo(`[Browser UI] await window.__antigravityUI.typeText(el, '${params.text}')`)
          yield* Effect.sleep("500 millis")
          
          return {
            title: "Browser Action",
            output: `Typed text into ${params.selector}`,
            metadata: {} as any
          }
        }),
      })
    )

    const navigate = Tool.define(
      "browser_navigate",
      Effect.succeed({
        description: "Navigate to a URL",
        parameters: NavigateToolParams,
        execute: (params: any) => Effect.succeed({
          title: "Browser Action",
          output: `Navigated to ${params.url}`,
          metadata: {} as any
        }),
      })
    )

    return BrowserSubagentTools.of({ click: yield* click, type: yield* type, navigate: yield* navigate })
  })
)
