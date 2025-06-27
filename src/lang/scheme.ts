import type { EvaluateFn } from '../types'
import { loadScript } from '../helper'
import { loadModule } from '../libs/loader'

type BiwaScheme = {
  Interpreter: new (onError: (e: Error) => void) => {
    evaluate: (code: string, callback: (result: unknown) => void) => void
  }
}

const guid = { current: 1 }

export function compile(code: string) {
  const lib = 'https://cdn.jsdelivr.net/gh/biwascheme/biwascheme@main/release/biwascheme-0.8.0.js'

  // Support for @import directive
  // ; @import <name|url> as <name>
  const importRegex = /^[;]+\s*@import\s+(\S+)\s+as\s+(\w+)/gm
  const importLines = Array.from(code.matchAll(importRegex))
  const codeBody = code.replace(importRegex, '').trim()

  const setup = async () => {
    await loadScript(lib)
    const context: Record<string, unknown> = {}
    for (const match of importLines) {
      const mod = await loadModule(match[1])
      context[match[2]] = mod
    }
    return context
  }

  const evaluate: EvaluateFn = async (context, helper) => {
    const global = globalThis as unknown as { BiwaScheme: BiwaScheme }
    return new Promise((resolve, reject) => {
      const onError = (e: Error) => reject(e)
      const biwa = new global.BiwaScheme.Interpreter(onError)

      const key = `__biwa_context_${guid.current++}`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(globalThis as any)[key] = context

      // Define accessors for each module
      for (const name of Object.keys(context)) {
        biwa.evaluate(`(define ${name} (js-ref (js-eval "${key}") "${name}"))`, () => {})
      }

      const originLog = globalThis.console.log
      globalThis.console.log = helper.log
      biwa.evaluate(codeBody, function (result) {
        globalThis.console.log = originLog
        // Clean up the temporary global
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (globalThis as any)[key]
        resolve(result)
      })
    })
  }

  return { setup, evaluate }
}
