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
