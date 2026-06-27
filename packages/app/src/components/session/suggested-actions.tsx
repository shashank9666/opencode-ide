import { For } from "solid-js"
import { useCommand } from "@/context/command"

const actions = [
  { id: "apply.changes", label: "Apply" },
  { id: "run.tests", label: "Run Tests" },
  { id: "git.commit", label: "Commit" },
  { id: "explain.code", label: "Explain" },
  { id: "refactor.code", label: "Refactor" },
  { id: "optimize.code", label: "Optimize" },
  { id: "generate.docs", label: "Generate Docs" },
  { id: "continue.response", label: "Continue" },
] as const

export function SuggestedActions() {
  const command = useCommand()

  return null;
}
