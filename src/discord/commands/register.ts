import {
  ActionRowBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'

import type { Command } from '../../types'

export const register: Command = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Associate Discord with GitHub'),
  modal: async (interaction) => {
    const initial = await interaction.reply({
      content: 'Awaiting user input',
    })

    const githubUsername = interaction.fields.getTextInputValue('github')

    const user = await interaction.client.ctx.db.user.findFirst({
      where: {
        github_username: githubUsername,
      },
    })
    if (user) {
      await interaction.client.ctx.db.user.update({
        where: {
          id: user.id,
        },
        data: {
          discord_id: interaction.user.id,
        },
      })
      await initial.edit({
        content: `:white_check_mark: Associated your Discord account with your GitHub account`,
      })
    } else {
      await initial.edit({
        content: `:x: No user found with GitHub username \`${githubUsername}\``,
      })
    }
  },
  run: async (interaction) => {
    const inputs = [
      new TextInputBuilder()
        .setCustomId('github')
        .setLabel('GitHub Username')
        .setPlaceholder('mygod')
        .setRequired(true)
        .setStyle(TextInputStyle.Short),
    ].map((input) =>
      new ActionRowBuilder<TextInputBuilder>().addComponents(input),
    )

    const modal = new ModalBuilder()
      .setCustomId('register')
      .setTitle('Associate Discord with GitHub')
      .addComponents(...inputs)

    await interaction.showModal(modal)
  },
}
