import type { EvaluatorFn } from '../types'

export function compile(code: string) {
  // 支持指令: // %import <url> as <name>
  const importRegex = /^\/\/\s*%import\s+(\S+)\s+as\s+(\w+)/gm
  const importLines = Array.from(code.matchAll(importRegex))
  const codeBody = code.replace(importRegex, '').trim()

  const setup = async () => {
    const context: Record<string, unknown> = {}
    for (const match of importLines) {
      const [, url, name] = match
      const mod = await import(/* load */ url)
      context[name] = mod
    }
    return context
  }
  const evaluate = compileEvaludate(codeBody) as EvaluatorFn
  return { setup, evaluate }
}

export function compileEvaludate(code: string) {
  const lines = code.split('\n').filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return new Function('$context', 'with ($context) { return undefined; }')
  }

  if (lines.length === 1) {
    const body = `
      with ($context) {
        return (${lines[0]});
      }
    `
    return new Function('$context', body)
  }

  const lastLine = lines[lines.length - 1]
  if (isLikelyExpression(lastLine)) {
    const body = 'with ($context) {\n' + lines.slice(0, -1).join('\n') + '\nreturn (' + lastLine + ');\n}'
    return new Function('$context', body)
  } else {
    const body = 'with ($context) {\n' + lines.join('\n') + '\n}'
    return new Function('$context', body)
  }
}

function isLikelyExpression(line: string) {
  return !/^\s*(let|const|var|function|return|if|for|while|class|switch|try|catch|do|import|export)\b/.test(line)
}
