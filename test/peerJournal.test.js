'use strict'

const PeerJournal = require('../src/peerJournal')
const chai = require('chai')
const assert = chai.assert
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

describe('PeerJournal', function () {
  beforeEach(async function () {
    this.peerJournal1 = new PeerJournal({ port: 9201, peerUrl: 'http://localhost:9202' })
    this.peerJournal2 = new PeerJournal({ port: 9202, peerUrl: 'http://localhost:9201' })
    await this.peerJournal1.listen()
    await this.peerJournal2.listen()
  })

  afterEach(async function () {
    await this.peerJournal1.stop()
    await this.peerJournal2.stop()
  })

  describe('addToJournal', function () {
    it('should be a function', async function () {
      assert.isFunction(this.peerJournal1.addToJournal)
    })
  })
})
