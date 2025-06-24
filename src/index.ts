import { format as prettyFormat } from 'pretty-format'
import '@logseq/libs'

const FENCE = '```'

const main = async () => {
  // const host = logseq.Experiments.ensureHostScope()

  logseq.Editor.registerSlashCommand('Create Runit Snippet', async (e) => {
    const snippet = `
${FENCE}js
console.log('hello')
${FENCE}
{{renderer :runit_${e.uuid}}}
`.trim()
    await logseq.Editor.insertAtEditingCursor(snippet)
  })

  logseq.App.onMacroRendererSlotted(async ({ slot, payload: { uuid, arguments: args } }) => {
    if (args[0]?.indexOf(':runit_') !== 0) {
      return
    }
    const block = await logseq.Editor.getBlock(uuid)
    if (!block) {
      return
    }

    const content = block.content
    const match = content.match(/```([a-zA-Z]*)\n([\s\S]*?)```/)
    if (!match) {
      return
    }

    const lang = match[1] || 'js'
    const code = match[2].trim()

    const res = await runCode(code, lang)
    const html = buildResponseHtml(res, slot, uuid)

    logseq.provideUI({
      key: `runit_${uuid}_${slot}`,
      slot,
      reset: true,
      template: html,
    })
  })
}

logseq.ready(main).catch(console.error)

async function runCode(code: string, lang: string) {
  if (lang === 'js') {
    return runJsCode(code)
  }
  return { result: `Unsupported language: ${lang}` }
}

type Args = unknown[]
type RunResponse = Partial<{
  outputs: Args[]
  result: unknown
  error: Error
}>

async function runJsCode(code: string): Promise<RunResponse> {
  let fn: Function
  try {
    fn = compileJs(code || 'undefined')
  } catch (error) {
    return { error: error as Error }
  }
  return runFn(fn)
}

function compileJs(code: string) {
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

function runFn(fn: Function) {
  const outputs: Args[] = []

  const log = (...args: unknown[]) => {
    globalThis.console.log(...args)
    outputs.push(args)
  }
  const g = globalThis
  const error = g.console.error.bind(g.console)
  const warn = g.console.warn.bind(g.console)
  const debug = g.console.debug.bind(g.console)
  const context = {
    console: { debug, error, warn, log },
  }

  try {
    const result = fn(context)
    return { outputs, result }
  } catch (error) {
    return { outputs, error: error as Error }
  }
}

function buildResponseHtml(res: RunResponse, _slot: string, _uuid: string): string {
  let html = '<div class="runit-output">'
  if (res.error) {
    html += `<div style="color:red;"><strong>Error:</strong> ${escapeHtml(res.error.message)}<br/><pre>${escapeHtml(res.error.stack || '')}</pre></div>`
  }

  if (res.outputs && res.outputs.length > 0) {
    html += '<div><strong>Console Output:</strong><ul>'
    for (const args of res.outputs) {
      const line = args.map((arg) => escapeHtml(typeof arg === 'string' ? arg : prettyFormat(arg))).join(' ')
      html += `<li>${line}</li>`
    }
    html += '</ul></div>'
  }

  html += `<div><pre>${escapeHtml(prettyFormat(res.result))}</pre></div>`

  html += '</div>'
  return html
}

function escapeHtml(str: string) {
  return String(str).replace(
    /[&<>"']/g,
    (s) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[s]!,
  )
}
