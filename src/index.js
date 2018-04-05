const PeerJournal = require('./peerJournal')
const TransactionJournal = require('./transactionJournal')

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
  getBalances () {
    this.transactionJournal.updateBalances()
    return this.transactionJournal.balances
  }
  sendTransaction (obj) {
    const packet = IlpPacket.serializeIlpPrepare(obj)
    return this.peerJournal.addToJournal(packet)
  }
  handleIncoming (fromLineNumber, fulfillments) {
    const upToLineNumber = this.peerJournal.journal.length
    for (let i = fromLineNumber; i < upToLineNumber; i++) {
      const entry = this.peerJournal.journal[i]
      if (entry.fromMe) {
        continue
      }
      const obj = IlpPacket.deserializeIlpPacket(entry.block)
      if (obj.typeString === 'ilp_prepare') {
        if (new Date(obj.data.expiresAt).getTime() < new Date().getTime()) {
          const packet = IlpPacket.serializeIlpReject({
            code: 'F00',
            triggeredBy: 'g.us.nexus.gateway',
            message: 'more details, human-readable',
            data: obj.executionCondition // used as identifier to link this result to the corresponding Prepare packet
            // TODO: support fulfilling/rejecting with application-level data
          })
        } else if (fulfillments[obj.data.executionCondition]) {
          const packet = IlpPacket.serializeIlpFulfill({
            fulfillment: fulfillments[obj.data.executionCondition],
            data: obj.executionCondition // used as identifier to link this result to the corresponding Prepare packet
            // TODO: support fulfilling/rejecting with application-level data
          })
        }
        this.peerJournal.addToJournal(packet)
      }
    }
    return upToLineNumber
  }
}

module.exports = IlpNode
