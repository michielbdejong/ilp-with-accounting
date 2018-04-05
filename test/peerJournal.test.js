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
    it('should add an entry on both sides', async function () {
      const block = Buffer.from('hi there!')
      const addedAtLine = await this.peerJournal1.addToJournal(block)
      assert.equal(addedAtLine, 0)
      assert.deepEqual(this.peerJournal1.journal, [ { lineNumber: 0, fromMe: true, block } ])
      assert.deepEqual(this.peerJournal2.journal, [ { lineNumber: 0, fromMe: false, block } ])
    })
    it('should resolve talking twice in a row', async function () {
      const block = Buffer.from('hi there!')
      const promise1 = this.peerJournal1.addToJournal(block)
      const promise2 = this.peerJournal1.addToJournal(block)
      assert.deepEqual([ await promise1, await promise2 ], [ 0, 1 ])
      assert.deepEqual(this.peerJournal1.journal, [ { lineNumber: 0, fromMe: true, block }, { lineNumber: 1, fromMe: true, block } ])
      assert.deepEqual(this.peerJournal2.journal, [ { lineNumber: 0, fromMe: false, block }, { lineNumber: 1, fromMe: false, block } ])
    })
    it('should resolve talking in stereo', async function () {
      const block = Buffer.from('hi there!')
      const promise1 = this.peerJournal1.addToJournal(block)
      const promise2 = this.peerJournal2.addToJournal(block)
      assert.deepEqual([ await promise1, await promise2 ].sort(), [ 0, 1 ])
      const firstOne = this.peerJournal1.journal[0].fromMe
      assert.deepEqual(this.peerJournal1.journal, [ { lineNumber: 0, fromMe: firstOne, block }, { lineNumber: 1, fromMe: !firstOne, block } ])
      assert.deepEqual(this.peerJournal2.journal, [ { lineNumber: 0, fromMe: !firstOne, block }, { lineNumber: 1, fromMe: firstOne, block } ])
    })
  })
})
