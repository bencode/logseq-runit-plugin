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
    const rewritten = rewritePythonCode(pyodide, code)
    await pyodide.runPython(rewritten)
    globalThis.console.log = originLog

    const result = pyodide.globals.get('__result__')
    return result
  }

  return { setup, evaluate }
}

function rewritePythonCode(pyodide: PyodideHandler, code: string): string {
  const lines = code.trimEnd().split('\n')
  if (lines.length === 0) {
    return code
  }

  const lastLine = lines[lines.length - 1]
  let isExpr = false
  try {
    pyodide.runPython(`compile(${JSON.stringify(lastLine)}, '<input>', 'eval')`)
    isExpr = true
  } catch {
    isExpr = false
  }
  if (isExpr) {
    lines[lines.length - 1] = `__result__ = (${lastLine})`
    return lines.join('\n')
  }
  return code
}
