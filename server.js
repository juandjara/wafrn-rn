const path = require('node:path')
const express = require('express')
const { createRequestHandler } = require('@expo/server/adapter/express')

const dist = path.join(__dirname, 'dist')
const client = path.join(dist, 'client')

const app = express()

// only use cache maxAge on files that are content-hashed
app.use(
  '/_expo/static',
  express.static(path.join(client, '_expo/static'), {
    maxAge: '1y',
    immutable: true,
  }),
)
// files here are not content-hashed, so we serve them normally
app.use(express.static(client, { index: false }))

// Resolves only html and api routes from dist/server/_expo/routes.json but no static assets.
app.use(createRequestHandler({ build: path.join(dist, 'server') }))

const port = Number(process.env.PORT ?? 3000)
app.listen(port, () => {
  console.log(`wafrn-rn web listening on ${port}`)
})
