import { Client, Events } from 'discord.js'

import { HELPERS, log } from '../../services/logger'

export function ready(client: Client): void {
  client.on(Events.ClientReady, async () => {
    if (!client.user || !client.application) {
      return
    }
    client.user.setActivity('I am a bot')

    log.info(HELPERS.discord, `${client.user.username} is online`)
  })
}
