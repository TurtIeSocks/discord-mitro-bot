import { startDiscord } from './discord/client'
import { startServer } from './services/server'
import { startPrisma } from './services/prisma'

async function main() {
  const prisma = startPrisma()
  const discord = await startDiscord(prisma)
  await startServer(prisma, discord)
}

main()
