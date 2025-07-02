export type Dict = Record<string, unknown>
export type Args = unknown[]

export type RunResponse = Partial<{
  outputs: Args[]
  result: unknown
  error: Error
}>

export type CompilerFactory = () => Promise<Compiler>
export type Compiler = (code: string) => Promise<EvaluateFn>

export type EvaluateFn = (context: Dict, helper: EvaluateHelper) => unknown
export type EvaluateHelper = {
  log: (...args: Args) => void
}
