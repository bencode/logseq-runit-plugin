import type { EvaluatorFn } from '../types'

export function compile(code: string) {
  const setup = async () => {}
  const evaludate = compileEvaludate(code) as EvaluatorFn
  return { setup, evaludate }
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
