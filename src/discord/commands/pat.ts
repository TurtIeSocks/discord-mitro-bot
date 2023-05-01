import { SlashCommandBuilder } from 'discord.js'

import type { Command } from '../../types'

export const pat: Command = {
  data: new SlashCommandBuilder()
    .setName('pat')
    .setDescription('Give Mimikyu a pat'),
  run: async (interaction) => {
    await interaction.reply({
      content: 'https://cdn.discordapp.com/emojis/800237004016975902.gif',
    })
  },
}
