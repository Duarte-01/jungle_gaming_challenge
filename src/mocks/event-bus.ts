import type { MarketEvent } from '../domain/checkout'
import type { Database } from './database'

export const mockEventBus = new EventTarget()
export function broadcast(event: MarketEvent) {
  mockEventBus.dispatchEvent(new CustomEvent('market-event', { detail: event }))
}
export function appendEvent(
  database: Database,
  type: MarketEvent['type'],
  resourceId: string,
  version: number,
  ownerId?: string,
  reason?: MarketEvent['reason'],
  actorId?: string,
) {
  const event: MarketEvent = {
    id: crypto.randomUUID(),
    sequence: ++database.eventSequence,
    type,
    resourceId,
    version,
    ...(ownerId ? { ownerId } : {}),
    ...(reason ? { reason } : {}),
    ...(actorId ? { actorId } : {}),
  }
  database.events.push(event)
  if (database.events.length > 500) database.events.shift()
}
