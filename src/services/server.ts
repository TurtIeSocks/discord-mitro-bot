import { PrismaClient } from '@prisma/client'
import type { Client } from 'discord.js'
import fastify, { RouteShorthandOptions } from 'fastify'
import config from 'config'
import { log, logToDiscord } from './logger'
import { GitHubSponsorshipEvent } from '../types'
import { buildProxy, jsonifyObject } from './utils'

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
    log.info(
      '[SPONSORSHIP WEBHOOK]',
      JSON.stringify({ headers: req.headers, body: req.body }, null, 2),
    )
    if (req.headers['x-github-event'] === 'sponsorship') {
      log.info('Received sponsor webhook', req.body.action)
      const { sponsor, tier } = req.body.sponsorship
      const username = sponsor.login.toLowerCase()
      switch (req.body.action) {
        case 'created':
          {
            const user = await this.prisma.user.findFirst({
              where: {
                github_username: username,
              },
            })
            if (user) {
              await this.prisma.user.update({
                where: {
                  id: user.id,
                },
                data: {
                  amount: tier.monthly_price_in_dollars,
                  active: !tier.is_one_time,
                },
              })
              log.info(
                `Updated ${sponsor.login} to tier ${tier.monthly_price_in_dollars} (one time: ${tier.is_one_time})`,
              )
            } else {
              const main = buildProxy(
                config.get<string>('endpoint.main'),
                username,
              )
              await this.prisma.user.create({
                data: {
                  github_username: username,
                  amount: tier.monthly_price_in_dollars,
                  active: true,
                  main_endpoint: main,
                  backup_endpoint: buildProxy(
                    config.get<string>('endpoint.backup'),
                    username,
                    main.split(':')[2].split('@')[0],
                  ),
                },
              })
              log.info(
                `Created ${sponsor.login} with tier ${tier.monthly_price_in_dollars} (one time: ${tier.is_one_time})`,
              )
            }
          }
          break
        case 'tier_changed':
          {
            const user = await this.prisma.user.findFirst({
              where: {
                github_username: username,
              },
            })
            if (user) {
              await this.prisma.user.update({
                where: {
                  id: user.id,
                },
                data: {
                  amount: tier.monthly_price_in_dollars,
                  active:
                    tier.monthly_price_in_dollars > 0 && !tier.is_one_time,
                },
              })
              log.info(
                `Updated ${sponsor.login} to tier ${tier.monthly_price_in_dollars} (one time: ${tier.is_one_time})`,
              )
            } else {
              await this.prisma.user.create({
                data: {
                  github_username: username,
                  amount: tier.monthly_price_in_dollars,
                  active: tier.monthly_price_in_dollars > 0,
                },
              })
              log.info(
                `Created ${sponsor.login} with tier ${tier.monthly_price_in_dollars} (one time: ${tier.is_one_time})`,
              )
            }
          }
          break
        case 'cancelled':
          {
            const user = await this.prisma.user.findFirst({
              where: {
                github_username: username,
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
          break
        default:
          break
      }
      const user = await this.prisma.user.findFirst({
        where: {
          github_username: username,
        },
      })
      logToDiscord(
        this.discord,
        config.get('discord.sponsorChannel'),
        jsonifyObject({
          action: req.body.action,
          user,
          one_time: tier.is_one_time,
          hook: user ? null : req.body.sponsorship,
        }),
      )
      res.status(200).send('OK')
    }
  },
)

app.get('/api/users', { preHandler: [auth] }, async function (req, res) {
  const users = await this.prisma.user.findMany().then((users) =>
    users
      .filter((user) => user.active && user.main_endpoint)
      .map((user) => {
        const [username, password] = user
          .main_endpoint!.split('@')[0]
          .replace('http://', '')
          .split(':')
        return username && password && `basic_auth ${username} ${password}`
      })
      .filter(Boolean)
      .join('\n'),
  )
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
