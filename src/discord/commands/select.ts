import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

import { jsonifyObject } from '../../services/utils'
import type { Command } from '../../types'

export const select: Command = {
  data: new SlashCommandBuilder()
    .setName('select')
    .setDescription('View all users in the database')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option
        .setName('active')
        .setDescription(
          'Set whether to only show all, active, or inactive users',
        )
        .setRequired(false),
    ),
  run: async (interaction) => {
    const active = interaction.options.get('active')?.value
    const users = await interaction.client.ctx.db.user.findMany({
      where: {
        active: active === undefined ? undefined : !!active,
      },
    })

    await interaction.reply({
      content: users.map((user) => jsonifyObject(user)).join('\n'),
    })
  },
}
