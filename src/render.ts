import { format as prettyFormat } from 'pretty-format'
import { escapeHtml } from './helper'

export type RenderData = ['$$render', unknown] | ['$$render', string, unknown]

const Layouts = {
  Row,
  Column,
} as Record<string, LayoutRender>
type LayoutRender = (list: string[]) => string

export function isRenderData(result: unknown): result is RenderData {
  return Array.isArray(result) && result[0] === '$$render'
}

export function renderToHtml(rd: RenderData): string {
  const layout = rd.length === 3 ? rd[1] : 'Row'
  const data = rd.length === 3 ? rd[2] : rd[1]
  if (Array.isArray(data)) {
    const list = data.map((item) => {
      return isRenderData(item) ? renderToHtml(item) : renderToJson(item)
    })
    const renderFn = Layouts[layout]
    return renderFn(list)
  }
  return String(data)
}

export function renderToJson(data: unknown) {
  return `<div><pre>${escapeHtml(prettyFormat(data))}</pre></div>`
}

function Row(list: string[]) {
  return `<div>${getListBody(list)}</div>`
}

function Column(list: string[]) {
  return `<div style="display: flex; gap: 10px">${getListBody(list)}</div>`
}

function getListBody(list: string[]) {
  return list.map((item) => `<div>${item}</div>`).join('\n')
}
