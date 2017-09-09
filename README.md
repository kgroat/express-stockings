# Express-stockings
## Express middleware for the socketized observable framework

### Installation
```
npm install express-stockings
```

### Purpose
Express is a widely used framework to create REST APIs in Node.js -- but to add realtime support, you usually have to create your own socket listeners, socket connections, and manage the modification of state yourself.  Even if you're utilizing a tool such as socket.io, this can get very ugly very quickly.
Stockings provides a way of cleanly and seamlessly subscribing to and broadcasting socket messages such that you don't have to worry about it at all.
On the server side, the express-stockings middleware adds functions directly to the express Request and Response objects.  The API footprint is small and easy to learn and use.  It introduces three new functions:
* `request.hasStockingsClient()`
* `response.subscribe(eventId, [mergeStrategy, upsertKey])`
* `response.broadcast(eventId, payload, [callback])`

### Usage

#### Apply middleware:
Minimal setup:
```javascript
import { middleware } from 'express-stockings'

let app = express()
app.use(middleware({
  server: 3001, // the port where socket connections should be made
  privateKey: 'SUPER SECRET PRIVATE KEY' // private key for jwt
}))
```

Avanced setup:
```javascript
import { middleware } from 'express-stockings'

let app = express()
let server = new http.Server(app)

app.use(middleware({
  server: server, // use the same http server and port as express
  privateKey: 'SUPER SECRET PRIVATE KEY', // private key for jwt
  publicKey: 'PUBLIC KEY -- SHARE ME!', // public key for jwt if the algorithm is asymmetric
  algorithm: 'RS256', // jwt algorithm -- this also is enforced upon decryption
  requestFilter: (req) => req.resource.indexOf('stockings') >= 0, // only serve requests made to the resources whose path contains 'stockings'
  disposeMetaAfter: 30 * 60 * 1000 // dispose connection metadata after half an hour of not being used or transferred (specified in milliseconds)
}))
```

#### Usage in a request:

Subscribing to a single event type:
```javascript
app.get('/user/:id', (req, res) => {
  let user
  // ... get user

  res.subscribe(`user:${user._id}`)

  res.send(user)
})
```

Subscribing to multiple events and specifying merge strategy:
```javascript
app.get('/user', (req, res) => {
  let users
  // ... get users

  users.each((user) => {
    res.subscribe(`user:${user._id}`, 'upsert', '_id')
  })

  res.send(users)
})
```

Broadcasting an event:
```javascript
app.put('/user/:id', (req, res) => {
  let user
  // ... get / update user

  res.broadcast(`user:${user._id}`, user)

  res.send(user)
})
```

Broadcasting an event with callback:
```javascript
app.put('/user/:id', (req, res) => {
  let user
  // ... get / update user
  res.broadcast(`user:${user._id}`, user, (err) => {
    if (err) {
      res.status(400).send(err)
    } else {
      res.send(user)
    }
  })
})
```

Checking if the request has a stockings socket connection:
```javascript
app.get('/user/:id', (req, res) => {
  let user
  // ... get user

  if (req.hasStockingsClient()) {
    // handle stockings-specific logic here
  }

  res.send(user)
})
```
