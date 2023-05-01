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
      log.info(`[${proxy}] OK!`)
    } else {
      log.warn(`[${proxy}] Failure!`)
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

export function jsonifyObject(obj: object) {
  return `\`\`\`json\n${JSON.stringify(obj, null, 2)}\`\`\``
}
