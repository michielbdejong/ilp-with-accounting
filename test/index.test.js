'use strict'

const crypto = require('crypto')
const sha256 = (preimage) => crypto.createHash('sha256').update(preimage).digest()
const IlpNode = require('../src/index')
const chai = require('chai')
const assert = chai.assert
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

describe('IlpNode', function () {
  beforeEach(async function () {
    this.ilpNode1 = new IlpNode(9201, 'http://localhost:9202')
    this.ilpNode2 = new IlpNode(9202, 'http://localhost:9201')
    await this.ilpNode1.start()
    await this.ilpNode2.start()
  })

  afterEach(async function () {
    this.ilpNode1.stop()
    this.ilpNode2.stop()
  })

  describe('sendTransaction', function () {
    it('should be a function', async function () {
      assert.isFunction(this.ilpNode1.sendTransaction)
    })
    it('should update the balances', async function () {
      const fulfillment = crypto.randomBytes(32)
      const executionCondition = sha256(fulfillment)
      console.log({ fulfillment, executionCondition }, 'sending transaction')
      const lineNumber = await this.ilpNode1.sendTransaction({
        amount: '123',
        destination: 'g.yes',
        executionCondition,
        expiresAt: new Date(new Date().getTime() + 10000),
        data: Buffer.alloc(0)
      })
      assert.equal(lineNumber, 0)
      console.log('transaction sent')

      // FIXME: why does getBalances return a Promise?
      const balances11 = await this.ilpNode1.getBalances()
      const balances12 = await this.ilpNode2.getBalances()
      assert.deepEqual(balances11, { current: 0, payable: 123, receivable: 0 })
      assert.deepEqual(balances12, { current: 0, payable: 0, receivable: 123 })
      console.log('got balances; handling incoming')

      await this.ilpNode2.handleIncoming(0, {
        [executionCondition]: fulfillment
      })

      console.log('incoming handled')

      // FIXME: why does getBalances return a Promise?
      const balances21 = await this.ilpNode1.getBalances()
      const balances22 = await this.ilpNode2.getBalances()
      assert.deepEqual(balances21, { current: -123, payable: 0, receivable: 0 })
      assert.deepEqual(balances22, { current: 123, payable: 0, receivable: 0 })
    })
  })
})
