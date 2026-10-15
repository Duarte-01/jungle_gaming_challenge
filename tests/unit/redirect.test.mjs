import test from 'node:test'
import assert from 'node:assert/strict'
import { safeReturnTo } from '../../src/domain/account.ts'

test('retorno mantém caminhos internos e rejeita destinos externos e ciclos de login', () => {
  assert.equal(safeReturnTo('/carrinho?origem=nft#resumo'), '/carrinho?origem=nft#resumo')
  assert.equal(safeReturnTo('/nfts/emerald-ape-42'), '/nfts/emerald-ape-42')
  for (const value of [
    undefined,
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/\t/example.com',
    '/%2f%2fexample.com',
    '/login?redirect=/login',
    '/foo/../login',
    '/%6cogin',
    '/cadastro',
    '/%ZZ',
  ]) {
    assert.equal(safeReturnTo(value), '/', `Destino rejeitado: ${String(value)}`)
  }
})
