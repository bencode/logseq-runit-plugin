import type { CompilerFactory, EvaluateFn } from '../types'
import { loadScript } from '../helper'

type PyodideLoader = () => Promise<PyodideHandler>
type PyodideHandler = {
  runPython: (code: string) => Promise<unknown>
  loadPyodide: (name: string) => Promise<void>
  loadPackage: (name: string) => Promise<void>
  pyimport: (name: string) => unknown
  globals: {
    get: (name: string) => {
      toJs: () => unknown
    }
  }
}

type MicroPipHandler = {
  install: (name: string) => Promise<void>
}

export const createCompiler: CompilerFactory = async () => {
  const lib = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js'
  await loadScript(lib)
  const global = globalThis as unknown as { loadPyodide: PyodideLoader }
  const pyodide = await global.loadPyodide()
  await pyodide.loadPackage('micropip')
  const pkgSet = new Set<string>()

  return async (code: string) => {
    const micropip = pyodide.pyimport('micropip') as MicroPipHandler
    const packages = extractPipInstalls(code)
    for (const pkg of packages) {
      if (pkgSet.has(pkg)) {
        continue
      }
      try {
        await micropip.install(pkg)
        pkgSet.add(pkg)
      } catch (error) {
        console.warn(`Failed to install package: ${pkg}`, error)
      }
    }

    const evaluate: EvaluateFn = async (_context, helper) => {
      const originLog = globalThis.console.log
      globalThis.console.log = helper.log
      const rewritten = rewritePythonCode(pyodide, code)
      await pyodide.runPython(rewritten)
      globalThis.console.log = originLog
      const result = pyodide.globals.get('__result__')
      return result?.toJs()
    }

    return evaluate
  }
}

function extractPipInstalls(code: string) {
  const lines = code.split('\n')
  const packages = lines.flatMap((line) => {
    const trimmed = line.trim()
    const match = trimmed.match(/^#%\s+pip\s+install\s+(.+)$/)
    return match ? match[1].split(/\s+/) : []
  })
  return packages
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
