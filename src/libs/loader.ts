import { load as loadGoogleCharts } from './google-charts'

const ramadUrl = 'https://esm.sh/ramda'
const libs = {
  'google-charts': loadGoogleCharts,
  ramda: () => import(ramadUrl),
} as Record<string, () => Promise<unknown>>

export function loadModule(url: string) {
  const re = /^https?:\/\//
  if (re.test(url)) {
    return import(url)
  }
  const load = libs[url]
  if (load) {
    return load()
  }
  throw new Error(`Module not found: ${url}`)
}
