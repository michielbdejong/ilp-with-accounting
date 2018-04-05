const PeerJournal = require('./peerJournal')


class TransactionJournal {
  constructor(peerJournal) {
    this.peerJournal = peerJournal
    this.balance = {
      current: 0,
      payable: 0,
      receivable: 0
    }
    this.lastBalanceLine = -1
  }
  updateBalances() {
    for (let i = lastBalanceLine + 1; i < this.peerJournal.journal.length; i++) {
      const obj = IlpPacket.deserializeIlpPacket(this.peerJournal.journal[i].block)
      if (obj.typeString === 'ilp_prepare') {
        if (this.peerJournal.journal[i].fromMe) {
          this.balance.payable += obj.data.amount // I prepare, so I may have to pay
        } else {
          this.balance.receivable += obj.data.amount // They prepare, so I may be able to receive
        }
      } else if (obj.typeString === 'ilp_fulfill') {
        if (this.peerJournal.journal[i].fromMe) {
          this.balance.receivable -= obj.data.amount // I fulfill, so I receive
          this.balance.current += obj.data.amount // and my balance increases
        } else {
          this.balance.payable -= obj.data.amount // they fulfill, so I pay
          this.balance.current -= obj.data.amount // and my balance decreases
        }
      } else if (obj.typeString === 'ilp_reject') {
        if (this.peerJournal.journal[i].fromMe) {
          this.balance.receivable -= obj.data.amount // I reject, so I will not receive
        } else {
          this.balance.payable -= obj.data.amount // they reject, so I will not pay
        }
      } else {
        // error
      }
    }
  }
}

module.exports = TransactionJournal
