const eventTypes = ['nft.updated', 'order.updated', 'quote.updated'] as const
const reasons = ['reservation', 'market'] as const

export interface MarketEvent {
  id: string
  sequence: number
  type: (typeof eventTypes)[number]
  resourceId: string
  version: number
  ownerId?: string
  actorId?: string
  reason?: (typeof reasons)[number]
}

// Keep the public wire boundary small; form schemas remain in their lazy modules.
export function parseMarketEvent(input: unknown): MarketEvent | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const value = input as Record<string, unknown>
  if (
    typeof value.id !== 'string' ||
    typeof value.resourceId !== 'string' ||
    typeof value.sequence !== 'number' ||
    !Number.isSafeInteger(value.sequence) ||
    value.sequence <= 0 ||
    typeof value.version !== 'number' ||
    !Number.isSafeInteger(value.version) ||
    value.version <= 0 ||
    !eventTypes.some((type) => type === value.type) ||
    (value.ownerId !== undefined && typeof value.ownerId !== 'string') ||
    (value.actorId !== undefined && typeof value.actorId !== 'string') ||
    (value.reason !== undefined && !reasons.some((reason) => reason === value.reason))
  )
    return null
  return {
    id: value.id,
    resourceId: value.resourceId,
    sequence: value.sequence,
    version: value.version,
    type: value.type as MarketEvent['type'],
    ...(value.ownerId !== undefined ? { ownerId: value.ownerId as string } : {}),
    ...(value.actorId !== undefined ? { actorId: value.actorId as string } : {}),
    ...(value.reason !== undefined ? { reason: value.reason as MarketEvent['reason'] } : {}),
  }
}
