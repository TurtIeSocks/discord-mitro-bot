import { PrismaClient } from '@prisma/client'
import config from 'config'

export function startPrisma() {
  return new PrismaClient({
    datasources: { db: { url: config.get('databaseUrl') } },
  })
}
