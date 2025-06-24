export type Dict = Record<string, unknown>
export type Args = unknown[]

export type RunResponse = Partial<{
  outputs: Args[]
  result: unknown
  error: Error
}>

export type EvaluatorFn = (context: Dict) => unknown

export type Compiler = (code: string) => {
  setup: () => Promise<Dict | undefined>
  evaluate: EvaluatorFn
}
