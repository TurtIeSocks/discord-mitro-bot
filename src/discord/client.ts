import { Client, Collection } from 'discord.js'
import { PrismaClient } from '@prisma/client'
import config from 'config'

import * as events from './events'
import * as commands from './commands'

export async function startDiscord(prisma: PrismaClient) {
  const client = new Client({
    intents: ['GuildMessages', 'GuildMembers', 'Guilds', 'DirectMessages'],
  })

  await client.login(config.get('discord.token'))

  client.ctx = {
    db: prisma,
    commands: new Collection(),
  }

  Object.values(commands).forEach((command) => {
    client.ctx.commands.set(command.data.name, command)
  })
  Object.values(events).forEach((event) => {
    event(client)
  })

  return client
}
