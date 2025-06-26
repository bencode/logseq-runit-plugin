import type { EvaluateFn } from '../types'
import { loadScript, sleep } from '../helper'

export function compile(code: string) {
  const lib = 'https://www.gstatic.com/charts/loader.js'

  const setup = async () => {
    await loadScript(lib)
  }

  const evaluate: EvaluateFn = async (_context, helper) => {
    const root = document.getElementById('app')!

    const div = document.createElement('div')
    div.id = 'chart-box'
    div.style.width = '400px'
    div.style.height = '300px'
    root.appendChild(div)

    const global = globalThis as unknown as { google: any }
    const google = global.google

    return new Promise((resolve) => {
      const draw = async () => {
        const data = google.visualization.arrayToDataTable([
          ['Year', 'Sales', 'Expenses'],
          ['2004', 1000, 400],
          ['2005', 1170, 460],
          ['2006', 660, 1120],
          ['2007', 1030, 540],
        ])

        const options = {
          title: 'Company Performance',
          curveType: 'function',
          legend: { position: 'bottom' },
        }
        const chart = new google.visualization.LineChart(div)
        chart.draw(data, options)

        await sleep(50)
        const svg = div.querySelector('svg')
        const parent = svg?.parentElement
        const html = parent?.innerHTML
        const result = html ? { $$render: 'html', data: html } : undefined
        resolve(result)
      }

      google.charts.load('current', { packages: ['corechart'] })
      google.charts.setOnLoadCallback(draw)
    })
  }

  return { setup, evaluate }
}
