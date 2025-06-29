import type { EvaluateFn } from '../types'
import { loadModule } from '../libs/loader'

export function compile(code: string) {
  const setup = async () => {
    const context = { $import: loadModule }
    return context
  }

  const fn = compileEvaludate(code)
  const evaluate: EvaluateFn = async (context, helper) => {
    const g = globalThis
    const error = g.console.error.bind(g.console)
    const warn = g.console.warn.bind(g.console)
    const debug = g.console.debug.bind(g.console)
    const console = { debug, warn, error, log: helper.log }
    const ctx = {
      ...context,
      console,
    }
    return fn(ctx)
  }
  return { setup, evaluate }
}

export function compileEvaludate(code: string) {
  const lines = code.split('\n').filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return new Function('$context', 'with ($context) { return undefined; }')
  }
  const toAsync = (body: string) => {
    return `
const fn = async() => {
${body}
}
return fn()`
  }

  const lastLine = lines[lines.length - 1]
  if (isLikelyExpression(lastLine)) {
    const body = 'with ($context) {\n' + lines.slice(0, -1).join('\n') + '\nreturn (' + lastLine + ');\n}'
    return new Function('$context', toAsync(body))
  } else {
    const body = 'with ($context) {\n' + lines.join('\n') + '\n}'
    return new Function('$context', toAsync(body))
  }
}

function isLikelyExpression(line: string) {
  const test = !/^\s*(let|const|var|function|return|if|for|while|class|switch|try|catch|do|import|export)\b/.test(line)
  if (!test) {
    return false
  }
  try {
    new Function(`return (${line})`)
    return true
  } catch {
    return false
  }
}
