import type { CompilerFactory, EvaluateFn } from '../types'
import { loadScript } from '../helper'

type BiwaScheme = {
  Interpreter: new (onError: (e: Error) => void) => {
    evaluate: (code: string, callback: (result: unknown) => void) => void
  }
}

export const createCompiler: CompilerFactory = async () => {
  const lib = 'https://cdn.jsdelivr.net/gh/biwascheme/biwascheme@main/release/biwascheme-0.8.0.js'
  await loadScript(lib)

  return async (code: string) => {
    const evaluate: EvaluateFn = async (_context, helper) => {
      const global = globalThis as unknown as { BiwaScheme: BiwaScheme }
      return new Promise((resolve, reject) => {
        const onError = (e: Error) => reject(e)
        const biwa = new global.BiwaScheme.Interpreter(onError)
        const originLog = globalThis.console.log
        globalThis.console.log = helper.log
        biwa.evaluate(code, function (result) {
          globalThis.console.log = originLog
          resolve(result)
        })
      })
    }
    return evaluate
  }
}
