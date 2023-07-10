import { Client, Events, Channel } from 'discord.js'
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
async function updateStatus(channel: Channel, userId: string) {
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
    if (channel.lastMessage?.author.id === userId) {
      if (
        channel.lastMessage.embeds.every(
          (embed, i) => embed.color === newMessage.embeds[i].color,
        )
      ) {
        await channel.lastMessage.edit(newMessage)
      } else {
        await channel.lastMessage.reply(newMessage)
      }
    } else if (channel.lastMessage) {
      await channel.lastMessage.reply(newMessage)
    } else {
      await channel.send(newMessage)
    }
  }
}

async function poll(...args: [Channel, string]): Promise<void> {
  return updateStatus(...args).finally(() => waitForMinute(() => poll(...args)))
}

export function ready(client: Client): void {
  client.on(Events.ClientReady, async () => {
    if (!client.user || !client.application) {
      return
    }
    client.user.setActivity(config.get('discord.activity'))

    log.info(HELPERS.discord, `${client.user.username} is online`)

    const channel = await client.channels.fetch(
      config.get('discord.logChannel'),
    )
    if (channel?.isTextBased()) {
      await channel.messages.fetch()
      await poll(channel, client.user.id)
    }
  })
}
