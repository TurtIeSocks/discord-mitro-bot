import { HELPERS, log } from '../../services/logger'
import type { Command } from '../../types'

import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

export const remove: Command = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a user from the database')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) => {
      return option
        .setName('id')
        .setRequired(true)
        .setDescription('Enter the users Discord ID or GitHub username')
        .setAutocomplete(true)
    }),
  autoComplete: async (interaction) => {
    const focusedValue = interaction.options.getFocused()
    console.log(focusedValue)
    const users = await interaction.client.ctx.db.user
      .findMany({
        where: {
          OR: [
            {
              github_username: {
                contains: focusedValue,
              },
            },
            {
              discord_id: {
                contains: focusedValue,
              },
            },
          ],
        },
        select: {
          id: true,
          discord_id: true,
          github_username: true,
        },
      })
      .then((res) => {
        return res.map((user) => ({
          name: user.github_username || user.discord_id || 'Unknown',
          value: `${user.id}`,
        }))
      })
    await interaction.respond(users)
  },
  run: async (interaction) => {
    const id = +(interaction.options.get('id')?.value || 0)
    log.info(HELPERS.discord, 'Removing user:', id)

    if (id) {
      const removed = await interaction.client.ctx.db.user.delete({
        where: { id },
      })
      await interaction.reply({
        content: `Removed user \`${removed.github_username}\``,
      })
    } else {
      await interaction.reply({
        content: `Could not find user with id \`${id}\``,
      })
    }
  },
}
