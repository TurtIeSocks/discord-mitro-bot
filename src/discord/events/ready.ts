import { Client, Events, Colors, APIEmbed } from 'discord.js'
import config from 'config'

import { HELPERS, log } from '../../services/logger'
import { getEmbed, tripleCheck } from '../../services/utils'

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
      const initialEmbeds: APIEmbed[] = []
      await tripleCheck(config.get('endpoint.main')).then((res) => {
        initialEmbeds.push(getEmbed(res, 'Main'))
      })
      await tripleCheck(config.get('endpoint.backup')).then((res) => {
        initialEmbeds.push(getEmbed(res, 'Backup'))
      })
      let failed = initialEmbeds.some((embed) => embed.color === Colors.Red)
      let sendNew = false

      await channel.messages.fetch()
      let message =
        channel.lastMessage?.author.id === client.user.id
          ? await channel.lastMessage.edit({
              content: 'Proxy Status:',
              embeds: initialEmbeds,
            })
          : channel.lastMessage
          ? await channel.lastMessage?.reply({
              content: 'Proxy Status:',
              embeds: initialEmbeds,
            })
          : await channel.send({
              content: 'Proxy Status:',
              embeds: initialEmbeds,
            })

      setInterval(async () => {
        const embeds: APIEmbed[] = []
        await tripleCheck(config.get('endpoint.main')).then((res) => {
          embeds.push(getEmbed(res, 'Main'))
        })
        await tripleCheck(config.get('endpoint.backup')).then((res) => {
          embeds.push(getEmbed(res, 'Backup'))
        })
        const runFailed = embeds.some((embed) => embed.color === Colors.Red)
        if (runFailed) {
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
      }, 1000 * 20)
    }
  })
}
