import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import config from 'config'
import { PrismaClient } from '../generated/prisma/client.js'

export function startPrisma() {
  const url = new URL(config.get<string>('databaseUrl'))
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  })
  return new PrismaClient({ adapter })
}
