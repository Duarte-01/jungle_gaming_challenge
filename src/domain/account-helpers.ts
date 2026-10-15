import type { z } from 'zod'

export function suggestedCollectorHandle(email: string) {
  return email
    .split('@')[0]
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .slice(0, 50)
    .padEnd(2, '-')
}
export function fieldErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(
    error.issues.map((issue) => [issue.path.length ? issue.path.join('.') : 'form', issue.message]),
  )
}

function hasUnsafeCharacter(value: string): boolean {
  return [...value].some(
    (character) =>
      character === '\\' || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
  )
}

export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || hasUnsafeCharacter(value)) return '/'
  try {
    const url = new URL(value, 'https://kurio.test')
    const path = decodeURIComponent(url.pathname)
    if (
      url.origin !== 'https://kurio.test' ||
      path.startsWith('//') ||
      hasUnsafeCharacter(path) ||
      /^\/(login|cadastro)(?:\/|$)/.test(path)
    )
      return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}
