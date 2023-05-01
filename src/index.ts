import config from 'config'

import { startDiscord } from './discord/client'
import { startServer } from './services/server'
import { startPrisma } from './services/prisma'
import { testEndpoint } from './services/utils'
import { logToDiscord } from './services/logger'

async function main() {
  const prisma = startPrisma()
  const discord = await startDiscord(prisma)

  setInterval(async () => {
    await testEndpoint(config.get('endpoint.main')).then(async (res) => {
      if (res.startsWith(':x:')) {
        await logToDiscord(discord, config.get('discord.logChannel'), res)
      }
    })
    await testEndpoint(config.get('endpoint.backup')).then(async (res) => {
      if (res.startsWith(':x:')) {
        await logToDiscord(discord, config.get('discord.logChannel'), res)
      }
    })
  }, 1000 * 60)
  await startServer(prisma, discord)
}

main()
