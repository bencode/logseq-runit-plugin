import type { EvaluateFn } from '../types'
import { loadScript } from '../helper'

type PyodideLoader = () => Promise<PyodideHandler>
type PyodideHandler = {
  runPython: (code: string) => Promise<unknown>
  globals: {
    get: (name: string) => {
      toJs: () => unknown
    }
  }
}

export function compile(code: string) {
  const lib = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js'
  const ref: { current?: PyodideHandler } = {}
  const setup = async () => {
    await loadScript(lib)
    const global = globalThis as unknown as { loadPyodide: PyodideLoader }
    ref.current = await global.loadPyodide()
  }

  const evaluate: EvaluateFn = async (_context, helper) => {
    const pyodide = ref.current!
    const originLog = globalThis.console.log
    globalThis.console.log = helper.log
    await pyodide.runPython(code)
    globalThis.console.log = originLog

    const result = pyodide.globals.get('__result__')
    return result
  }

  return { setup, evaluate }
}
