export type Dict = Record<string, unknown>
export type Args = unknown[]

export type RunResponse = Partial<{
  outputs: Args[]
  result: unknown
  error: Error
}>

export type EvaluateFn = (context: Dict, helper: EvaluateHelper) => unknown
export type EvaluateHelper = {
  log: (...args: Args) => void
}

export type Compiler = (code: string) => {
  setup: () => Promise<Dict | undefined>
  evaluate: EvaluateFn
}
