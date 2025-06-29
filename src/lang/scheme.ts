import type { EvaluateFn } from '../types'
import { loadScript, sleep } from '../helper'

type BiwaScheme = {
  Interpreter: new (onError: (e: Error) => void) => {
    evaluate: (code: string, callback: (result: unknown) => void) => void
  }
}

export function compile(code: string) {
  const lib = 'https://cdn.jsdelivr.net/gh/biwascheme/biwascheme@main/release/biwascheme-0.8.0.js'

  const setup = async () => {
    await loadScript(lib)
    // Wait for BiwaScheme library to fully initialize its global objects
    // The script load event fires before the library sets up its globals
    await sleep(10)
    const context: Record<string, unknown> = {}
    return context
  }

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

  return { setup, evaluate }
}
