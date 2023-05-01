import { HELPERS, log } from '../../services/logger'
import type { Command } from '../../types'

import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

export const update: Command = {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Update a user in the database')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('id')
        .setRequired(true)
        .setDescription("Enter the user's Discord ID or GitHub username")
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName('discord_id')
        .setDescription("Update the user's Discord ID")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('github_username')
        .setDescription("Update the user's GitHub username")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('main_endpoint')
        .setDescription("Update the user's main endpoint")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('backup_endpoint')
        .setDescription("Update the user's backup endpoint")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName('active')
        .setDescription("Update whether the user's proxy is active")
        .setRequired(false),
    )
    .addNumberOption((option) =>
      option
        .setName('amount')
        .setDescription("Update the user's sponsorship amount")
        .setRequired(false),
    ),
  autoComplete: async (interaction) => {
    const focusedValue = interaction.options.getFocused()
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

    if (id) {
      const discordId = interaction.options.get('discord_id')?.value
      const githubUsername = interaction.options.get('github_username')?.value
      const active = interaction.options.get('active')?.value
      const mainEndpoint = interaction.options.get('main_endpoint')?.value
      const backup_endpoint = interaction.options.get('backup_endpoint')?.value
      const amount = interaction.options.get('amount')?.value

      log.info(HELPERS.discord, 'Updating user:', {
        id,
        discordId,
        githubUsername,
        active,
        mainEndpoint,
        backup_endpoint,
        amount,
      })

      await interaction.client.ctx.db.user.update({
        where: { id },
        data: {
          discord_id: discordId ? `${discordId}` : undefined,
          github_username: githubUsername ? `${githubUsername}` : undefined,
          active: typeof active === 'boolean' ? active : undefined,
          main_endpoint: mainEndpoint ? `${mainEndpoint}` : undefined,
          backup_endpoint: backup_endpoint ? `${backup_endpoint}` : undefined,
          amount: amount ? +amount || 0 : undefined,
        },
      })

      await interaction.reply({
        content: `Updated user with ID \`${id}\``,
      })
    } else {
      await interaction.reply({
        content: `Invalid ID \`${id}\``,
      })
    }
  },
}
