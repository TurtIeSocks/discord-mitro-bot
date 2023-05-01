import { testEndpoint } from '../../services/utils'
import type { Command } from '../../types'

import { MessageFlags, SlashCommandBuilder } from 'discord.js'

export const status: Command = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check whether your endpoint is valid'),
  run: async (interaction) => {
    const user = await interaction.client.ctx.db.user.findFirst({
      where: {
        discord_id: interaction.user.id,
      },
    })

    if (user?.active) {
      if (user.main_endpoint) {
        await interaction.reply({
          content: `Main Endpoint: ${await testEndpoint(user.main_endpoint)}`,
          flags: MessageFlags.SuppressEmbeds,
        })
      }
      if (user.backup_endpoint) {
        await interaction.followUp({
          flags: MessageFlags.SuppressEmbeds,
          content: `Backup Endpoint: ${await testEndpoint(
            user.backup_endpoint,
          )}`,
        })
      }
    } else {
      await interaction.reply({
        content:
          'You are not registered in the database or your proxy is not active',
      })
    }
  },
}
