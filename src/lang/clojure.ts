import type { EvaluateFn } from '../types'
import { loadScript } from '../helper'

type EsciApp = {
  execute: (code: string) => Promise<unknown>
}

export function compile(code: string) {
  const lib = 'https://cdn.jsdelivr.net/gh/bencode/logseq-runit-plugin@main/esci/public/js/main.js'

  const setup = async () => {
    await loadScript(lib)
    const context: Record<string, unknown> = {}
    return context
  }

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

  return { setup, evaluate }
}
