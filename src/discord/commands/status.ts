import { getEmbed, testEndpoint } from '../../services/utils'
import type { Command } from '../../types'

import { APIEmbed, MessageFlags, SlashCommandBuilder } from 'discord.js'

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
      const embeds: APIEmbed[] = []
      if (user.main_endpoint) {
        embeds.push(getEmbed(await testEndpoint(user.main_endpoint), 'Main'))
      }
      if (user.backup_endpoint) {
        embeds.push(
          getEmbed(await testEndpoint(user.backup_endpoint), 'Backup'),
        )
      }
      await interaction.reply({
        content: 'Proxy Status:',
        embeds,
        ephemeral: true,
        flags: MessageFlags.SuppressEmbeds,
      })
    } else {
      await interaction.reply({
        content:
          'You are not registered in the database or your proxy is not active',
        ephemeral: true,
      })
    }
  },
}
