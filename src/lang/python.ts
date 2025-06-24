import type { EvaluatorFn } from '../types'
import { loadScript } from '../helper'

type PyodideLoader = () => Promise<PyodideHandler>
type PyodideHandler = {
  runPython: (code: string) => Promise<unknown>
}

export function compile(code: string) {
  const lib = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js'
  let pyodide: PyodideHandler

  const setup = async () => {
    await loadScript(lib)
    const global = globalThis as unknown as { loadPyodide: PyodideLoader }
    pyodide = await global.loadPyodide()
    return {} as Record<string, unknown>
  }

  const evaluate: EvaluatorFn = async (_context) => {
    if (!pyodide) {
      throw new Error('Pyodide is not initialized. Please call setup() first.')
    }
    const result = await pyodide.runPython(code)
    return result
  }

  return { setup, evaluate }
}
