import type { CompilerFactory, EvaluateFn } from '../types'
import { loadScript } from '../helper'

type EsciApp = {
  execute: (code: string) => Promise<unknown>
}

export const createCompiler: CompilerFactory = async () => {
  const lib = 'https://cdn.jsdelivr.net/gh/bencode/logseq-runit-plugin@v0.1.0/esci/public/js/main.js'
  await loadScript(lib)

  return async (code: string) => {
    const evaluate: EvaluateFn = async (_context, helper) => {
      const global = globalThis as unknown as { esci: { app: EsciApp } }
      if (!global.esci) {
        throw new Error('ClojureScript runtime not available')
      }
      const originLog = globalThis.console.log
      globalThis.console.log = helper.log
      try {
        const result = await global.esci.app.execute(code)
        return result
      } finally {
        globalThis.console.log = originLog
      }
    }
    return evaluate
  }
}
