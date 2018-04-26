# ilp-with-accounting

This exploratory implementation of ILP+accounting deals with resending messages if no ack arrives, and has a semaphore for adding transfers to the log, which prevents the two peers from "talking at the same time".

I wrote it in a few hours, but I think it correctly addresses the basic idea of SNAP. It's based on http-oer, but similar message flows could also be done on top of WebSockets.

When dealing with, say, 1,000 transactions per second, it's probably better to loosen up the semaphore, and keep two append-only logs (one for each direction), which are only netted against each other e.g. once per second, not after each transaction.

When dealing with, say, 100,000 transactions per second, it might be better not to do real-time accounting, and instead have a separate off-line, batched, netting/settlement process, and also to just let dropped messages fail instead of repeating each dropped message until it gets processed.

* [peerJournal.js](https://github.com/michielbdejong/ilp-with-accounting/blob/master/src/peerJournal.js) deals with the 'database level' stuff, i.e. sending messages to make sure both nodes have the same view of the data.
* [transactionJournal.js](https://github.com/michielbdejong/ilp-with-accounting/blob/master/src/transactionJournal.js) deals with looking inside the ILP packets to keep track of the current trustline balance
* see [the unit tests](https://github.com/michielbdejong/ilp-with-accounting/blob/master/test/index.test.js) for an example of how to use `sendTransaction` and `handleIncoming`.
