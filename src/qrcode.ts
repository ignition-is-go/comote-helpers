import * as QRCode from 'qrcode'
import { ComoteServerConfig } from './types'

function formatConfigToLink(config: ComoteServerConfig) {
  let link = `comote://settings?`
  const query: string[] = []

  if ('id' in config) {
    query.push(`id=${config.id}`)
  }

  if (Number.isFinite(config.interval) && config.interval > 0) {
    query.push(`interval=${config.interval}`)
  }

  if (config.ws) {
    const protocol = config.ws.protocol
    const hostname = config.ws.hostname
    const port = config.ws.port
    const pathname = config.ws.pathname

    // build valid url
    // only hostname is required
    if (!hostname) {
      throw new Error(`Invalid WebSocket config: ${config.ws}`)
    }

    let url = `ws-url=`

    url += protocol == 'ws' || protocol == 'wss' ? `${protocol}://` : `ws://`

    url += hostname

    if (port) {
      url += `:${port}`
    }

    if (pathname) {
      url += pathname
    }

    query.push(url)

    // autostart
    if (config.ws.autostart === true) {
      query.push(`ws-enable=1`)
    }
  }

  if (config.osc) {
    const { hostname, port } = config.osc

    if (!hostname || !Number.isInteger(port)) {
      throw new Error(`Invalid WebSocket config: ${config.osc}`)
    }

    query.push(`osc-url=udp://${hostname}:${port}`)

    if (config.osc.autostart === true) {
      query.push(`osc-enable=1`)
    }
  }

  link += query.join('&')

  return link
}

/**
 * Return the link to be encoded in the QRCode accroding to given `CoMoteConfig`
 */
export function rawLink(config: ComoteServerConfig) {
  return formatConfigToLink(config)
}

/**
 * Create a qrcode to be logged in terminal according to given `CoMoteConfig``
 *
 * @param {CoMoteConfig} config
 * @example
 * console(await CoMoteQRCode.terminal(config));
 */
export async function terminal(config: ComoteServerConfig) {
  const link = formatConfigToLink(config)
  return await QRCode.toString(link, { type: 'terminal' })
}

/**
 * Create a qrcode to be used as in Image source according to given `CoMoteConfig``
 *
 * @param {CoMoteConfig} config
 * @example
 * const qrCode = await CoMoteQRCode.dataURL(config));
 *
 * <img src="${qrCode}" />
 */
export async function dataURL(config) {
  const link = formatConfigToLink(config)
  return await await QRCode.toDataURL(link)
}
