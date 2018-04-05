const IlpPacket = require('ilp-packet')

class TransactionJournal {
  constructor (peerJournal) {
    this.peerJournal = peerJournal
    this.balance = {
      current: 0,
      payable: 0,
      receivable: 0
    }
    this.lastBalanceLine = -1
    this.prepareAmounts = {}
  }
  updateBalances () {
    for (let i = this.lastBalanceLine + 1; i < this.peerJournal.journal.length; i++) {
      const obj = IlpPacket.deserializeIlpPacket(this.peerJournal.journal[i].block)
      if (obj.typeString === 'ilp_prepare') {
        const amount = parseInt(obj.data.amount)
        this.prepareAmounts[obj.data.executionCondition.toString('hex')] = amount
        if (this.peerJournal.journal[i].fromMe) {
          this.balance.payable += amount // I prepare, so I may have to pay
        } else {
          this.balance.receivable += amount // They prepare, so I may be able to receive
        }
      } else if (obj.typeString === 'ilp_fulfill') {
        const amount = this.prepareAmounts[obj.data.data.toString('hex')] // TODO: use a different field than the packet data for linking this!
        if (this.peerJournal.journal[i].fromMe) {
          this.balance.receivable -= amount // I fulfill, so I receive
          this.balance.current += amount // and my balance increases
        } else {
          this.balance.payable -= amount // they fulfill, so I pay
          this.balance.current -= amount // and my balance decreases
        }
      } else if (obj.typeString === 'ilp_reject') {
        const amount = this.prepareAmounts[obj.data.data.toString('hex')] // TODO: use a different field than the packet data for linking this!
        if (this.peerJournal.journal[i].fromMe) {
          this.balance.receivable -= amount // I reject, so I will not receive
        } else {
          this.balance.payable -= amount // they reject, so I will not pay
        }
      } else {
        // error
      }
    }
    this.lastBalanceLine = this.peerJournal.journal.length - 1
  }
}

module.exports = TransactionJournal
