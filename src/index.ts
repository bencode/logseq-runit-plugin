import '@logseq/libs'

const FENCE = '```'

const main = async () => {
  const host = logseq.Experiments.ensureHostScope()

  logseq.Editor.registerSlashCommand('Create runit snippet', async (e) => {
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

    const lang = match[1]
    const code = match[2]
    const html = `${code}`

    logseq.provideUI({
      key: `runit_${uuid}_${slot}`,
      slot,
      reset: true,
      template: html,
    })
  })
}

logseq.ready(main).catch(console.error)
