import { Client, Events, Colors, APIEmbed } from 'discord.js'
import config from 'config'

import { HELPERS, log } from '../../services/logger'
import { getEmbed, testEndpoint } from '../../services/utils'

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
      let failed = false
      let sendNew = false
      const initialEmbeds: APIEmbed[] = []
      await testEndpoint(config.get('endpoint.main')).then(async (res) => {
        initialEmbeds.push(getEmbed(res, 'Main'))
      })
      await testEndpoint(config.get('endpoint.backup')).then(async (res) => {
        initialEmbeds.push(getEmbed(res, 'Backup'))
      })

      await channel.messages.fetch()
      let message =
        channel.lastMessage?.author.id === client.user.id
          ? await channel.lastMessage.edit({
              content: 'Proxy Status:',
              embeds: initialEmbeds,
            })
          : await channel.send({
              content: 'Proxy Status:',
              embeds: initialEmbeds,
            })

      setInterval(async () => {
        const embeds: APIEmbed[] = []
        await testEndpoint(config.get('endpoint.main')).then(async (res) => {
          embeds.push(getEmbed(res, 'Main'))
        })
        await testEndpoint(config.get('endpoint.backup')).then(async (res) => {
          embeds.push(getEmbed(res, 'Backup'))
        })
        if (embeds.some((embed) => embed.color === Colors.Red)) {
          // if any of the proxies are down
          if (!failed) {
            // if we haven't already sent a message
            failed = true
            sendNew = true
          }
        } else if (failed) {
          // if it previously failed and now all is good
          failed = false
          sendNew = true
        }
        const newMessage = {
          content: 'Proxy Status:',
          embeds,
        }
        if (sendNew) {
          message = await channel.send(newMessage)
          sendNew = false
        } else {
          await message.edit(newMessage)
        }
      }, 1000 * 20) // 20 seconds
    }
  })
}
