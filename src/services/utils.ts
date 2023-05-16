import fetch, { FetchError } from 'node-fetch'
import ProxyAgent from 'proxy-agent'
import config from 'config'
import { log } from './logger'
import { APIEmbed, Colors } from 'discord.js'
import { ProxyStatus } from '../types'

export async function testEndpoint(proxy: string): Promise<ProxyStatus> {
  const controller = new AbortController()

  const timeout = setTimeout(() => {
    controller.abort()
  }, 10_000)

  try {
    const res = await fetch(config.get('endpoint.test'), {
      agent: new ProxyAgent(proxy),
      // @ts-ignore
      signal: controller.signal,
    })
    if (res.status === 200) {
      log.info(`[${proxy}] ${res.status} ${res.statusText}`)
    } else {
      log.warn(`[${proxy}] ${res.status} ${res.statusText}`)
    }
    return {
      code: res.status,
      message: res.statusText,
    }
  } catch (e) {
    log.error(e)
    if (e instanceof FetchError) {
      return {
        code: 500,
        message:
          e.code ||
          e.message
            .replace(`to ${config.get('endpoint.test')}`, '')
            .replace(proxy, ''),
      }
    }
    return {
      code: 500,
      message: e instanceof Error ? e.message : 'Unknown error',
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function tripleCheck(endpoint: string) {
  return testEndpoint(endpoint).then(async (res) => {
    if (res.code === 200) return res
    await new Promise((resolve) => setTimeout(resolve, 20_000))
    return testEndpoint(endpoint).then(async (res2) => {
      if (res2.code === 200) return res2
      await new Promise((resolve) => setTimeout(resolve, 20_000))
      return testEndpoint(endpoint)
    })
  })
}

export function jsonifyObject(obj: object | null) {
  return `\`\`\`json\n${JSON.stringify(obj, null, 2)}\`\`\``
}

export function getPassword() {
  const length = 16
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let retVal = ''
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n))
  }
  return retVal
}

export function buildProxy(
  proxy: string,
  username: string,
  password = getPassword(),
) {
  return `http://${username}:${password}@${proxy.split('@')[1]}`
}

export function getEmbed(status: ProxyStatus, proxy: string): APIEmbed {
  return {
    title: `${status.code} for ${proxy} Proxy`,
    color: { 200: Colors.Green, 500: Colors.Red }[status.code] || Colors.Yellow,
    timestamp: new Date().toISOString(),
    description: status.message,
  }
}
