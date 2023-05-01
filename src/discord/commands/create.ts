import {
  ActionRowBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import config from 'config'

import type { Command } from '../../types'

export const create: Command = {
  data: new SlashCommandBuilder()
    .setName('create')
    .setDescription('Create a new user to the database!')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  modal: async (interaction) => {
    const initial = await interaction.reply({
      content: 'Adding new user to the database',
    })

    const discordId = interaction.fields.getTextInputValue('discordId')
    const githubUsername =
      interaction.fields.getTextInputValue('githubUsername')
    const amount = +interaction.fields.getTextInputValue('amount') || 0

    const newUser = await interaction.client.ctx.db.user.create({
      data: {
        discord_id: discordId,
        github_username: githubUsername,
        main_endpoint:
          interaction.fields.getTextInputValue('mainEndpoint') ||
          config
            .get<string>('endpoint.main')
            ?.replace('pokelame', githubUsername),
        backup_endpoint:
          interaction.fields.getTextInputValue('backupEndpoint') ||
          config
            .get<string>('endpoint.backup')
            ?.replace('pokelame', githubUsername),
        amount,
        active: !!amount,
      },
    })

    await initial.edit({
      content: `Added user ${newUser.github_username}, with endpoints:`,
    })

    await interaction.followUp({
      content: `\`${newUser.main_endpoint}\``,
    })
    await interaction.followUp({
      content: `\`${newUser.backup_endpoint}\``,
    })
  },
  run: async (interaction) => {
    const inputs = [
      new TextInputBuilder()
        .setCustomId('discordId')
        .setLabel('Discord User ID')
        .setPlaceholder('123456789')
        .setStyle(TextInputStyle.Short),
      new TextInputBuilder()
        .setCustomId('githubUsername')
        .setLabel('GitHub Username')
        .setPlaceholder('mygod')
        .setStyle(TextInputStyle.Short),
      new TextInputBuilder()
        .setCustomId('amount')
        .setLabel('Sponsorship Amount')
        .setPlaceholder('1')
        .setStyle(TextInputStyle.Short),
      new TextInputBuilder()
        .setCustomId('mainEndpoint')
        .setLabel("User's main endpoint")
        .setPlaceholder('Leave blank to autogenerate')
        .setStyle(TextInputStyle.Short)
        .setRequired(false),
      new TextInputBuilder()
        .setCustomId('backupEndpoint')
        .setLabel("User's backup endpoint")
        .setPlaceholder('Leave blank to autogenerate')
        .setStyle(TextInputStyle.Short)
        .setRequired(false),
    ].map((input) =>
      new ActionRowBuilder<TextInputBuilder>().addComponents(input),
    )

    const modal = new ModalBuilder()
      .setCustomId('create')
      .setTitle('Create a new user')
      .addComponents(...inputs)

    await interaction.showModal(modal)
  },
}
