const PeerJournal = require('./peerJournal')
const TransactionJournal = require('./transactionJournal')
const IlpPacket = require('ilp-packet')

class IlpNode {
  constructor (port, peerUrl) {
    this.peerJournal = new PeerJournal({ port, peerUrl })
    this.transactionJournal = new TransactionJournal(this.peerJournal)
  }
  async start () {
    await this.peerJournal.listen()
  }
  async stop () {
    await this.peerJournal.stop()
  }
  async getBalances () {
    this.transactionJournal.updateBalances()
    return this.transactionJournal.balance
  }
  sendTransaction (obj) {
    const packet = IlpPacket.serializeIlpPrepare(obj)
    return this.peerJournal.addToJournal(packet)
  }
  async handleIncoming (fromLineNumber, fulfillments) {
    const upToLineNumber = this.peerJournal.journal.length
    for (let i = fromLineNumber; i < upToLineNumber; i++) {
      const entry = this.peerJournal.journal[i]
      if (entry.fromMe) {
        continue
      }
      const obj = IlpPacket.deserializeIlpPacket(entry.block)
      if (obj.typeString === 'ilp_prepare') {
        let packet
        if (new Date(obj.data.expiresAt).getTime() < new Date().getTime()) {
          packet = IlpPacket.serializeIlpReject({
            code: 'F00',
            triggeredBy: 'g.us.nexus.gateway',
            message: 'more details, human-readable',
            data: obj.data.executionCondition // used as identifier to link this result to the corresponding Prepare packet
            // TODO: support fulfilling/rejecting with application-level data
          })
        } else if (fulfillments[obj.data.executionCondition]) {
          packet = IlpPacket.serializeIlpFulfill({
            fulfillment: fulfillments[obj.data.executionCondition],
            data: obj.data.executionCondition // used as identifier to link this result to the corresponding Prepare packet
            // TODO: support fulfilling/rejecting with application-level data
          })
        }
        await this.peerJournal.addToJournal(packet)
      }
    }
    return upToLineNumber
  }
}

module.exports = IlpNode
