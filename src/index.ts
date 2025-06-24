import { format as prettyFormat } from 'pretty-format'
import '@logseq/libs'
import type { Args, EvaluatorFn, RunResponse } from './types'
import { escapeHtml } from './helper'
import { compile as compileJs } from './lang/js'

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

async function runJsCode(code: string): Promise<RunResponse> {
  try {
    const { setup, evaludate } = compileJs(code || 'undefined')
    return runFn(evaludate)
  } catch (error) {
    return { error: error as Error }
  }
}

function runFn(fn: EvaluatorFn) {
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
