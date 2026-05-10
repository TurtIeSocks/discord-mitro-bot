import { startDiscord } from './discord/client.js'
import { startServer } from './services/server.js'
import { startPrisma } from './services/prisma.js'

async function main() {
  const prisma = startPrisma()
  const discord = await startDiscord(prisma)
  await startServer(prisma, discord)
}

main()
