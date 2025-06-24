import '@logseq/libs'
import { format as prettyFormat } from 'pretty-format'
import type { Args, EvaluateFn, RunResponse, Compiler } from './types'
import { escapeHtml } from './helper'
import { compile as compileJs } from './lang/js'
import { compile as compilePython } from './lang/python'
import { compile as compileScheme } from './lang/scheme'

const Compilers = {
  js: compileJs,
  python: compilePython,
  scheme: compileScheme,
} as Record<string, Compiler>

const main = async () => {
  logseq.Editor.registerSlashCommand('Create Runit Snippet', async (e) => {
    const snippet = `
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
    window.console.log('runit', { lang, code })

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
  const compile = Compilers[lang]
  if (!compile) {
    throw new Error(`Unsupported language: ${lang}`)
  }
  try {
    const { setup, evaluate } = compile(code)
    const context = await setup()
    return runFn(evaluate, context)
  } catch (error) {
    return { error: error as Error }
  }
}

async function runFn(fn: EvaluateFn, context: Record<string, unknown> | undefined) {
  const outputs: Args[] = []
  const log = (...args: unknown[]) => {
    outputs.push(args)
  }

  const ctx = { ...context }
  try {
    const result = await fn(ctx, { log })
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
