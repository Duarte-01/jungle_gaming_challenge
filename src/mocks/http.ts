import { delay, HttpResponse } from 'msw'
import type { z } from 'zod'
import { fieldErrors } from '../domain/account'

export class ApiFault extends Error {
  status: number
  code: string
  fields?: Record<string, string>
  details?: Record<string, unknown>
  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
    this.details = details
  }
}

export async function parseBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ApiFault(400, 'INVALID_JSON', 'Envie um JSON válido.')
  }
  const result = schema.safeParse(body)
  if (!result.success)
    throw new ApiFault(
      422,
      'VALIDATION_ERROR',
      'Confira os campos informados.',
      fieldErrors(result.error),
    )
  return result.data
}

export async function respond(
  run: () => Response | Promise<Response>,
  control = false,
): Promise<Response> {
  const scenario = localStorage.getItem('kurio:scenario')
  await delay(
    !control && scenario === 'slow' ? 2000 : !control && scenario === 'favorite-error' ? 750 : 120,
  )
  if (scenario === 'offline' && !control) return HttpResponse.error()
  try {
    return await run()
  } catch (error) {
    if (error instanceof ApiFault)
      return HttpResponse.json(
        { code: error.code, message: error.message, fields: error.fields, details: error.details },
        { status: error.status },
      )
    return HttpResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Não foi possível concluir. Tente novamente.' },
      { status: 500 },
    )
  }
}

export function controlResponse(run: () => Response | Promise<Response>) {
  return respond(run, true)
}
