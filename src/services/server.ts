import { PrismaClient } from '@prisma/client'
import type { Client } from 'discord.js'
import fastify, { RouteShorthandOptions } from 'fastify'
import config from 'config'
import { log } from './logger'
import { GitHubSponsorshipEvent } from '../types'

const app = fastify()

const auth: RouteShorthandOptions['preHandler'] = async (
  request,
  reply,
  next,
) => {
  if (request.headers['x-mitro-secret'] !== config.get('apiSecret')) {
    reply.code(401).send({ error: 'Unauthorized' })
    log.warn('Unauthorized request', request.headers)
  } else {
    next()
  }
}

app.post<{ Body: GitHubSponsorshipEvent }>(
  '/api/sponsor',
  async function (req, res) {
    if (req.headers['x-github-event'] !== 'sponsorship') {
      log.info('Received sponsor webhook', req.body.action)
      const { sponsor, tier } = req.body.sponsorship
      switch (req.body.action) {
        case 'created': {
          const user = await this.prisma.user.findFirst({
            where: {
              github_username: sponsor.login,
            },
          })
          if (user) {
            await this.prisma.user.update({
              where: {
                id: user.id,
              },
              data: {
                amount: tier.monthly_price_in_dollars,
              },
            })
            log.info(
              `Updated ${sponsor.login} to tier ${tier.monthly_price_in_dollars}`,
            )
          } else {
            await this.prisma.user.create({
              data: {
                github_username: sponsor.login,
                amount: tier.monthly_price_in_dollars,
              },
            })
          }
        }
        case 'tier_changed': {
          const user = await this.prisma.user.findFirst({
            where: {
              github_username: sponsor.login,
            },
          })
          if (user) {
            await this.prisma.user.update({
              where: {
                id: user.id,
              },
              data: {
                amount: tier.monthly_price_in_dollars,
              },
            })
            log.info(
              `Updated ${sponsor.login} to tier ${tier.monthly_price_in_dollars}`,
            )
          } else {
            await this.prisma.user.create({
              data: {
                github_username: sponsor.login,
                amount: tier.monthly_price_in_dollars,
              },
            })
          }
        }
        case 'cancelled': {
          const user = await this.prisma.user.findFirst({
            where: {
              github_username: sponsor.login,
            },
          })
          if (user) {
            await this.prisma.user.update({
              where: {
                id: user.id,
              },
              data: {
                amount: 0,
                active: false,
              },
            })
            log.info(`Updated ${sponsor.login} to tier 0`)
          }
        }
        default:
          break
      }
      res.status(200).send('OK')
    }
  },
)

app.get('/api/users', { preHandler: [auth] }, async function (req, res) {
  const users = await this.prisma.user.findMany()
  res.send(users)
})

export async function startServer(prisma: PrismaClient, discord: Client) {
  app.decorate('prisma', prisma)
  app.decorate('discord', discord)

  return app
    .listen({
      host: config.get('host') || '0.0.0.0',
      port: config.get('port') || 3001,
    })
    .then((address) => log.info(`Server listening on ${address}`))
}
