import { Client, Events, Channel, Message } from 'discord.js'
import config from 'config'

import { HELPERS, log } from '../../services/logger'
import { getEmbed, testEndpoint } from '../../services/utils'
import { ProxyMessage } from '../../types'

function waitForMinute(cb: () => void) {
  const date = new Date()
  return setTimeout(
    cb,
    (60 - date.getUTCSeconds()) * 1000 - date.getUTCMilliseconds(),
  )
}
async function updateStatus(
  channel: Channel,
  userId: string,
  lastMessage: Message | undefined,
) {
  const newMessage: ProxyMessage = {
    content: 'Proxy Status:',
    embeds: [],
  }
  await testEndpoint(config.get('endpoint.main')).then((res) => {
    newMessage.embeds.push(getEmbed(res, 'Main'))
  })
  await testEndpoint(config.get('endpoint.backup')).then((res) => {
    newMessage.embeds.push(getEmbed(res, 'Backup'))
  })

  if (channel?.isTextBased()) {
    if (
      lastMessage?.author.id === userId &&
      lastMessage.embeds.every(
        (embed, i) => embed.title === newMessage.embeds[i].title,
      )
    ) {
      return await lastMessage.edit(newMessage)
    } else {
      return await channel.send(newMessage)
    }
  }
}

function poll(
  channel: Channel,
  userId: string,
  lastMessage: Message | undefined,
) {
  updateStatus(channel, userId, lastMessage)
    .then((m) => (lastMessage = m))
    .finally(() => waitForMinute(() => poll(channel, userId, lastMessage)))
}

export function ready(client: Client): void {
  client.on(Events.ClientReady, async () => {
    if (!client.user || !client.application) {
      log.error(HELPERS.discord, 'Client not ready', client.toJSON())
      return
    }
    client.user.setActivity(config.get('discord.activity'))

    log.info(HELPERS.discord, `${client.user.username} is online`)

    const guild = await client.guilds.fetch(config.get('discord.guildId'))

    const channel = await guild.channels.fetch(config.get('discord.logChannel'))
    if (channel?.isTextBased()) {
      const messages = await channel.messages.fetch()
      const userId = client.user.id
      poll(
        channel,
        userId,
        messages.filter((i: Message) => i.author.id === userId).first(),
      )
    }
  })
}
