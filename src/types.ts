export type Args = unknown[]

export type RunResponse = Partial<{
  outputs: Args[]
  result: unknown
  error: Error
}>

export type EvaluatorFn = (context: Record<string, unknown>) => unknown
