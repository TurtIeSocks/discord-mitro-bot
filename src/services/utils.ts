import fetch from 'node-fetch'
import ProxyAgent from 'proxy-agent'
import config from 'config'
import { log } from './logger'

export async function testEndpoint(proxy: string) {
  try {
    const res = await fetch(config.get('endpoint.test'), {
      agent: new ProxyAgent(proxy),
    })
    if (res.status === 200) {
      log.info(`[${proxy}] ${res.status} ${res.statusText}`)
    } else {
      log.warn(`[${proxy}] ${res.status} ${res.statusText}`)
    }
    return `:white_check_mark: ${res.status} ${res.statusText}`
  } catch (e) {
    if (e instanceof Error) {
      log.error(e.message)
      return `:x: ${e.message}`
    }
    return 'Error'
  }
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

export function buildProxy(proxy: string, username: string) {
  return `http://${username}:${getPassword()}@${proxy.split('@')[1]}`
}
