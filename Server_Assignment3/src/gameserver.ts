import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { expressMiddleware } from '@as-integrations/express5'
import { makeExecutableSchema } from '@graphql-tools/schema'
import cors from 'cors'
import express from 'express'
import { PubSub } from 'graphql-subscriptions'
import { useServer } from 'graphql-ws/use/ws'
import { WebSocketServer } from 'ws'
import { create_api, type Broadcaster } from './api'
import { MemoryStore } from './memorystore'
import { create_resolvers, game_topic, PENDING_GAMES } from './resolvers'

const PORT = 4000
const PATH = '/graphql'
const typeDefs = readFileSync(join(__dirname, 'uno.sdl'), 'utf8')

async function startServer() {
  const pubsub = new PubSub()
  const broadcaster: Broadcaster = {
    send_game: (game) => pubsub.publish(game_topic(game.id), { game }),
    send_pending_games: (games) => pubsub.publish(PENDING_GAMES, { games }),
  }
  const api = create_api(broadcaster, new MemoryStore())
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: create_resolvers(pubsub, api),
  })

  const app = express()
  const httpServer = createServer(app)

  // Subscriptions run over WebSockets on the same path as queries and mutations
  const wsServer = new WebSocketServer({ server: httpServer, path: PATH })
  const subscriptionServer = useServer({ schema }, wsServer)

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await subscriptionServer.dispose()
            },
          }
        },
      },
    ],
  })
  await server.start()

  app.use(PATH, cors(), express.json(), expressMiddleware(server))

  httpServer.listen(PORT, () => {
    console.log(`UNO GraphQL server ready at http://localhost:${PORT}${PATH}`)
  })
}

startServer().catch((error) => {
  console.error(error)
  process.exit(1)
})
