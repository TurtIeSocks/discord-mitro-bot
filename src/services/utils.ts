import fetch, { FetchError } from 'node-fetch'
import ProxyAgent from 'proxy-agent'
import config from 'config'
import { log } from './logger'
import { APIEmbed, Colors } from 'discord.js'
import { ProxyStatus } from '../types'
import generatePassword from "password-generator";

export async function testEndpoint(proxy: string): Promise<ProxyStatus> {
  for (let tries = 2; tries >= 0; --tries) {
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
      if (tries) continue
      if (e instanceof FetchError) {
        return {
          code: -1,
          message:
              e.code ||
              e.message
                  .replace(`to ${config.get('endpoint.test')}`, '')
                  .replace(proxy, ''),
        }
      }
      return {
        code: -2,
        message: e instanceof Error ? e.message : `${e}`,
      }
    } finally {
      clearTimeout(timeout)
    }
  }
  return {
    code: -3,
    message: "uh oh",
  }
}

export function jsonifyObject(obj: object | null) {
  return `\`\`\`json\n${JSON.stringify(obj, null, 2)}\`\`\``
}

export function getPassword() {
  return generatePassword(20)
}

export function buildProxy(
  proxy: string,
  username: string,
  password = getPassword(),
) {
  return `http://${username}:${password}@${proxy.split('@')[1]}`
}

export function getEmbed(status: ProxyStatus, proxy: string): APIEmbed {
  let color: number = Colors.Red
  if (status.code === 200) color = Colors.Green; else if (status.code > 200 && status.code < 400) color = Colors.Yellow
  return {
    title: `${status.code} for ${proxy} Proxy`,
    color: color,
    timestamp: new Date().toISOString(),
    description: status.message,
  }
}
