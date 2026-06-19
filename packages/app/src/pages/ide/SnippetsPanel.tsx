import { For, createSignal } from "solid-js"

type Snippet = { prefix: string; description: string; body: string; scope?: string }

export default function SnippetsPanel(props: { onClose?: () => void }) {
  const [scope, setScope] = createSignal<string | undefined>(undefined)
  const snippets: Snippet[] = [
    { prefix: "clg", description: "Console log", body: "console.log($0);", scope: "javascript,typescript" },
    { prefix: "fn", description: "Arrow function", body: "const $1 = ($2) => {\n  $0\n}", scope: "javascript,typescript" },
    { prefix: "imp", description: "Import statement", body: "import { $1 } from '$2'", scope: "javascript,typescript" },
    { prefix: "rfc", description: "React Functional Component", body: "const $1 = (props: $2) => {\n  return (\n    <div>$0</div>\n  )\n}\n\nexport default $1", scope: "typescript,typescriptreact" },
    { prefix: "try", description: "Try/catch block", body: "try {\n  $0\n} catch (error) {\n  console.error(error)\n}", scope: "javascript,typescript" },
  ]

  const filtered = () => scope() ? snippets.filter((s) => s.scope?.includes(scope() ?? "")) : snippets

  return (
    <div class="size-full flex flex-col bg-surface-base">
      <div class="flex items-center justify-between px-3 py-1.5 border-b border-border-base shrink-0" style={{ "min-height": "34px" }}>
        <span class="text-11-medium text-text-weaker uppercase tracking-wider">SNIPPETS</span>
        <select class="px-2 py-0.5 text-12-regular bg-surface-base border border-border-base rounded" value={scope() ?? ""} onChange={(e) => setScope(e.currentTarget.value || undefined)}>
          <option value="">All Scopes</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
        </select>
      </div>
      <div class="flex-1 overflow-y-auto">
        <For each={filtered()}>
          {(s) => (
            <div class="px-3 py-2 border-b border-border-base/50 hover:bg-surface-raised-base-hover cursor-pointer">
              <div class="flex items-center gap-2">
                <span class="text-12-medium text-accent-base bg-accent-base/10 px-1.5 py-0.5 rounded font-mono">{s.prefix}</span>
                <span class="text-12-regular text-text-strong flex-1 truncate">{s.description}</span>
              </div>
              {s.scope && <div class="text-11-regular text-text-weaker mt-1 ml-1">{s.scope}</div>}
            </div>
          )}
        </For>
      </div>
    </div>
  )
}