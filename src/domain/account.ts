import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Informe um e-mail válido.')
  .max(150)
export const passwordSchema = z
  .string()
  .min(10, 'Use pelo menos 10 caracteres.')
  .max(128, 'Use até 128 caracteres.')
  .regex(/[a-zA-Z]/, 'Inclua letras.')
  .regex(/\d/, 'Inclua números.')
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(80, 'Use até 80 caracteres.'),
  email: emailSchema,
  password: passwordSchema,
})
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha.').max(128),
})
export const profileSchema = registerSchema.pick({ name: true, email: true }).extend({
  phone: z
    .string()
    .trim()
    .max(25, 'Use até 25 caracteres.')
    .regex(/^[+\d\s()-]*$/, 'Informe um telefone válido.'),
  avatarUrl: z
    .string()
    .max(400_000, 'A imagem deve ter até 250 KB.')
    .regex(
      /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z\d+/=]+$/,
      'Use uma imagem PNG, JPEG ou WebP.',
    )
    .nullable(),
})
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.').max(128),
  newPassword: passwordSchema,
})

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl: string | null
}

export interface Session {
  user: User | null
  expiresAt: number | null
  notices?: string[]
}

export interface ApiProblem {
  code: string
  message: string
  fields?: Record<string, string>
}

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileInput = z.infer<typeof profileSchema>

export function fieldErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(
    error.issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message]),
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
