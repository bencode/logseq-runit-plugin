import { loadScript, sleep } from '../helper'

const guid = { current: 1 }

type GoogleCharts = {
  charts: {
    load: (version: string, options: { packages: string[] }) => void
    setOnLoadCallback: (callback: () => void) => void
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visualization: any
}

export async function load() {
  const lib = 'https://www.gstatic.com/charts/loader.js'
  await loadScript(lib)

  const global = globalThis as unknown as { google: GoogleCharts }

  const load = (packages: string[]) => {
    return new Promise<void>((resolve) => {
      global.google.charts.load('current', {
        packages,
      })
      global.google.charts.setOnLoadCallback(resolve)
    })
  }

  await load(['corechart', 'bar', 'line', 'scatter', 'gauge', 'geochart', 'table'])

  const render = async (type: string, data: unknown[], options: unknown) => {
    const id = `google_chart_${guid.current++}`
    const div = document.createElement('div')
    div.id = id
    const root = document.getElementById('app')!
    root.appendChild(div)

    const Ctor = global.google.visualization[type]
    if (!Ctor) {
      throw new Error(`Google Charts type "${type}" is not supported.`)
    }

    const chart = new Ctor(div)
    const chartData = Array.isArray(data) ? global.google.visualization.arrayToDataTable(data) : data
    chart.draw(chartData, options)
    await sleep(50)

    const html = div.querySelector('svg')?.outerHTML
    return ['$$render', html]
  }

  return { load, render }
}
