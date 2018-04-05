const http = require('http')
const fetch = require('node-fetch')

const MAX_BACKOFF = 1000

class PeerJournal {
  constructor (opts) {
    this.opts = opts
    this.journal = []
  }

  async listen () {
    this.server = http.createServer((req, res) => {
      let chunks = []
      req.on('data', (chunk) => { chunks.push(chunk) })
      req.on('end', async () => {
        const block = Buffer.concat(chunks)
        const lineNumber = req.url.substring(1)
        res.writeHead(200)
        // start synchronous block
        if (this.journal.length === lineNumber && !this.talking) {
          this.journal.push({ lineNumber, fromMe: false, block })
          // end synchronous block
          res.end('OK')
        } else {
          res.end('me first')
        }
      })
    })
    await this.server.listen(this.opts.port)
  }

  async stop () {
    await this.server.close()
  }

  async addToJournal (block) {
    if (!this.talking) {
      this.talking = true
      const lineNumber = this.journal.length
      const response = await fetch(this.opts.peerUrl + '/' + lineNumber, {
        method: 'POST',
        body: block
      })
      console.log(response)
      if (response === 'OK') {
        this.journal.push({ lineNumber, fromMe: true, block })
        this.talking = false
        return lineNumber
      }
      this.talking = false
    }
    // back off for a random time between 0 and MAX_BACKOFF ms:
    await new Promise(resolve => setTimeout(resolve, Math.random() * MAX_BACKOFF))
    return this.addToJournal(block)
  }
}

module.exports = PeerJournal
