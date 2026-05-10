import { MessageFlags, SlashCommandBuilder } from 'discord.js'
import { jsonifyObject } from '../../services/utils.js'
import type { Command } from '../../types.js'

export const info: Command = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Returns your user info'),
  run: async (interaction) => {
    const user = await interaction.client.ctx.db.user.findFirst({
      where: {
        discord_id: interaction.user.id,
      },
    })
    if (user) {
      await interaction.reply({
        content: jsonifyObject(user),
        flags: MessageFlags.Ephemeral,
      })
    } else {
      await interaction.reply({
        content: 'No user found',
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}
