import test from 'node:test'
import assert from 'node:assert/strict'
import { parseMarketEvent } from '../../src/domain/market-event.ts'

test('evento de rede malformado não atravessa a validação do cliente', () => {
  const event = {
    id: 'market-1',
    sequence: 1,
    type: 'nft.updated',
    resourceId: 'emerald-ape-42',
    version: 2,
  }
  assert.deepEqual(parseMarketEvent(event), event)
  for (const patch of [
    { version: '2' },
    { version: 0 },
    { version: Number.MAX_SAFE_INTEGER + 1 },
    { sequence: 1.5 },
    { type: 'unexpected' },
    { ownerId: 3 },
  ])
    assert.equal(parseMarketEvent({ ...event, ...patch }), null)
})
