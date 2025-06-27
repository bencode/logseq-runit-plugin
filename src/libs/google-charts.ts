import { loadScript } from '../helper'

declare global {
  interface Window {
    google: {
      charts: {
        load: (version: string, options: { packages: string[] }) => void
        setOnLoadCallback: (callback: () => void) => void
      }
      visualization: any
    }
  }
}

export async function load() {
  const lib = 'https://www.gstatic.com/charts/loader.js'
  await loadScript(lib)

  // Load the Google Charts library with common packages
  await new Promise<void>((resolve) => {
    window.google.charts.load('current', {
      packages: ['corechart', 'bar', 'line', 'scatter', 'gauge', 'geochart', 'table'],
    })
    window.google.charts.setOnLoadCallback(() => resolve())
  })

  return window.google
}
