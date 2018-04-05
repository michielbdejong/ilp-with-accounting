'use strict'

const TransactionJournal = require('../src/transactionJournal')
const chai = require('chai')
const assert = chai.assert
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

describe('TransactionJournal', function () {
  beforeEach(async function () {
    this.transactionJournal = new TransactionJournal()
  })

  describe('updateBalances', function () {
    it('should be a function', async function () {
      assert.isFunction(this.transactionJournal.updateBalances)
    })
  })
})
