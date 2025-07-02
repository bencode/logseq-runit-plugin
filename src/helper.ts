import '@logseq/libs'

const loadMap = new Map<string, Promise<void>>()

export function escapeHtml(str: string) {
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

export function loadScript(url: string): Promise<void> {
  const defer = loadMap.get(url)
  if (defer) {
    return defer
  }
  const next = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`))
    document.head.appendChild(script)
  })
  loadMap.set(url, next)
  return next
}

export function sleep(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}
