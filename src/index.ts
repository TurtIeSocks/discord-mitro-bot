import { startDiscord } from './discord/client.js'
import { startPrisma } from './services/prisma.js'
import { startServer } from './services/server.js'

async function main() {
  const prisma = startPrisma()
  const discord = await startDiscord(prisma)
  await startServer(prisma, discord)
}

main()
