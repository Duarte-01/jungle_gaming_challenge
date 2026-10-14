import test from 'node:test'
import assert from 'node:assert/strict'
import { ethToWei, weiToEth } from '../../src/lib/eth.ts'

test('soma decimal mantém precisão sem ponto flutuante', () => {
  assert.equal(weiToEth(ethToWei('0.1') + ethToWei('0.2')), '0.3')
  assert.equal(weiToEth(ethToWei('0.000000000000000001')), '0.000000000000000001')
  assert.equal(weiToEth(ethToWei('99999.123456789012345678') * 3n), '299997.370370367037037034')
})

test('não aceita negativos, exponentes ou precisão além de 18 casas', () => {
  for (const value of ['-1', '1e3', 'NaN', '1.1234567890123456789', '', '1,2']) {
    assert.throws(() => ethToWei(value))
  }
  assert.throws(() => weiToEth(-1n))
})
