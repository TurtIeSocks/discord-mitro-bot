import { REST, Routes } from 'discord.js'
import config from 'config'

import * as commands from './src/discord/commands'

const rest = new REST().setToken(config.get('discord.token'))

;(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        config.get('discord.clientId'),
        config.get('discord.guildId'),
      ),
      { body: [] },
    )
    await rest.put(Routes.applicationCommands(config.get('discord.clientId')), {
      body: [],
    })

    const data = await rest.put(
      Routes.applicationGuildCommands(
        config.get('discord.clientId'),
        config.get('discord.guildId'),
      ),
      { body: Object.values(commands).map((cmd) => cmd.data.toJSON()) },
    )
    console.log(`Successfully registered application commands: ${data}`)
  } catch (error) {
    console.error(error)
  }
})()
