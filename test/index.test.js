'use strict'

const IlpNode = require('../src/index')
const chai = require('chai')
const assert = chai.assert
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

describe('IlpNode', function () {
  beforeEach(async function () {
    this.ilpNode = new IlpNode()
  })

  describe('updateBalances', function () {
    it('should be a function', async function () {
      assert.isFunction(this.ilpNode.sendTransaction)
    })
  })
})
