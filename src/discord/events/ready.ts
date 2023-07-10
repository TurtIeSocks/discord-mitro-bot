import { Client, Events, Colors, APIEmbed } from 'discord.js'
import config from 'config'

import { HELPERS, log } from '../../services/logger'
import {getEmbed, testEndpoint} from '../../services/utils'

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
      let lastEmbeds: APIEmbed[] = []
      await testEndpoint(config.get('endpoint.main')).then((res) => {
        lastEmbeds.push(getEmbed(res, 'Main'))
      })
      await testEndpoint(config.get('endpoint.backup')).then((res) => {
        lastEmbeds.push(getEmbed(res, 'Backup'))
      })

      await channel.messages.fetch()
      let message =
        channel.lastMessage?.author.id === client.user.id
          ? await channel.lastMessage.edit({
              content: 'Proxy Status:',
              embeds: lastEmbeds,
            })
          : channel.lastMessage
          ? await channel.lastMessage?.reply({
              content: 'Proxy Status:',
              embeds: lastEmbeds,
            })
          : await channel.send({
              content: 'Proxy Status:',
              embeds: lastEmbeds,
            })

      const poll = () => (async () => {
        const embeds: APIEmbed[] = []
        await testEndpoint(config.get('endpoint.main')).then((res) => {
          embeds.push(getEmbed(res, 'Main'))
        })
        await testEndpoint(config.get('endpoint.backup')).then((res) => {
          embeds.push(getEmbed(res, 'Backup'))
        })
        let sendNew = false
        for (let i = 0; i < 2; ++i) {
          if (embeds[i].title !== lastEmbeds[i].title) {
            sendNew = true
            break
          }
        }
        lastEmbeds = embeds
        const newMessage = {
          content: 'Proxy Status:',
          embeds,
        }
        if (sendNew) {
          message = await channel.send(newMessage)
        } else {
          await message.edit(newMessage)
        }
      })().finally(() => {
        const date = new Date()
        setTimeout(poll, (60 - date.getUTCSeconds()) * 1000 - date.getUTCMilliseconds())
      })
      poll()
    }
  })
}
