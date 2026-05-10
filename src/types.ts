import type { PrismaClient } from './generated/prisma/client.js'
import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  Collection,
  AutocompleteInteraction,
  CacheType,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  ModalSubmitInteraction,
  Client,
  APIEmbed,
} from 'discord.js'

export interface Command {
  data:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder
  autoComplete?: (
    interaction: AutocompleteInteraction<CacheType>,
  ) => Promise<void>
  modal?: (interaction: ModalSubmitInteraction) => Promise<void>
  run: (interaction: ChatInputCommandInteraction) => Promise<void>
}

declare module 'discord.js' {
  interface Client {
    ctx: {
      commands: Collection<string, Command>
      db: PrismaClient
    }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    discord: Client
    prisma: PrismaClient
  }
}

interface Sponsor {
  login: string
  id: number
}

interface Tier {
  monthly_price_in_dollars: number
  is_one_time: boolean
  is_custom_amount: boolean
}

interface Sponsorship {
  sponsor: Sponsor
  tier: Tier
}

export interface Cancelled {
  action: 'cancelled'
  sponsorship: Sponsorship
}

export interface Changed {
  action: 'tier_changed'
  sponsorship: Sponsorship
  changes: {
    tier: {
      from: Tier
    }
  }
}

export interface Created {
  action: 'created'
  sponsorship: Sponsorship
}

export type GitHubSponsorshipEvent = Cancelled | Changed | Created

export interface ProxyStatus {
  code: number
  message: string
}

export interface ProxyMessage {
  content: string
  embeds: APIEmbed[]
}
