import * as WebSocket from 'ws'
// @ts-ignore
import { Server as OscServer } from 'node-osc'
import { ComoteServerConfig } from './types'

/**
 * @typedef {Object} CoMoteConfig
 * @property {String} id - id of the client CoMo.te
 * @property {Number} interval - period in ms of the sensors for the client CoMo.te
 * @property {CoMoteTarget} osc - OSC configuration
 * @property {CoMoteTarget} ws - WebSocket configuration
 */

/**
 * @typedef {Object} CoMoteTarget
 * @property {String} hostname - hostname or ip of the WebSocket or OSC server
 * @property {Number} port - listening port of the of the WebSocket or OSC server
 * @property {Boolean} autostart - enable streaming on CoMo.te application
 */

/**
 * Launch WebSocket and/or OSC server according to given `CoMoteConfig` object
 *
 * @param {CoMoteConfig} config - CoMote configuration
 * @param {Object} options - options
 * @param {Object} [options.verbose=false] - logs debug informations
 */
export class Server {
  private config: ComoteServerConfig

  private _websocketServer: WebSocket.Server
  private _oscServer: OscServer
  private _verbose: boolean

  private _wsListeners: Set<any>
  private _oscListeners: Set<any>

  constructor(config: ComoteServerConfig, options?: { verbose: boolean }) {
    /**
     * Configuration of the CoMote server
     */
    this.config = config

    this._verbose = !!options?.verbose

    if (this._verbose) {
      console.log('+ CoMo.te config:')
      console.log(this.config, '\n')
    }

    this._websocketServer = null
    this._oscServer = null

    this._wsListeners = new Set()
    this._oscListeners = new Set()
  }

  async start() {
    let wsPromise: Promise<boolean>
    let oscPromise: Promise<boolean>

    if (!!this.config.ws) {
      const { hostname, port } = this.config.ws

      if (!Number.isInteger(port)) {
        throw new Error(`Invalid port "${port}" for WebSocket server`)
      }

      if (this._verbose) {
        console.log(`> CoMo.te: Launching WebSocket server on port: ${port}`)
      }

      this._websocketServer = new WebSocket.Server({ port, host: '0.0.0.0' })

      const sockets = new Map()

      this._websocketServer.on('connection', (socket, request) => {
        // const ip = request.socket.remoteAddress;
        socket.on('message', (data, isBinary) => {
          if (isBinary) {
            // @todo
          } else {
            // do we really need this check?
            data = JSON.parse(data.toString())

            if (this._verbose) {
              console.log(`> CoMo.te: new WebSocket message`, data)
            }

            // console.log(data);
            // console.log(this._wsListeners.size);
            this._wsListeners.forEach((listener) => listener(data))
          }
        })

        // When a socket closes, or disconnects, remove it from the array.
        socket.on('close', (code, data) => {
          if (this._verbose) {
            console.log('> CoMo.te: closed socket connection')
          }
        })
      })

      wsPromise = new Promise<boolean>((resolve, reject) => {
        this._websocketServer.on('listening', () => {
          if (this._verbose) {
            console.log(`> CoMo.te: WebSocket server listening`)
          }

          resolve(true)
        })

        this._websocketServer.on('error', (err) => {
          console.log(`> CoMo.te: WebSocket server error`, err)
          reject(err)
        })
      })
    }

    if (!!this.config.osc) {
      const { hostname, port } = this.config.osc

      if (!Number.isInteger(port)) {
        throw new Error(`Invalid port "${port}" for OSC server`)
      }

      if (this._verbose) {
        console.log(
          `> CoMo.te: Launching OSC server udp://${
            hostname ?? '0.0.0.0'
          }:${port}`,
        )
      }

      oscPromise = new Promise((resolve, reject) => {
        this._oscServer = new OscServer(
          this.config.osc.port,
          hostname,
          (err) => {
            if (err) {
              console.log(`> CoMo.te: OSC server error`, err)
              reject()
              return
            }

            if (this._verbose) {
              console.log(`> CoMo.te: OSC server listening`)
            }

            resolve(true)
          },
        )

        this._oscServer.on('message', (data) => {
          let address = data.shift()

          if (this._verbose) {
            console.log(`> CoMo.te: new OSC message "${address}":`, data)
          }

          this._oscListeners.forEach((callback) => callback(address, data))
        })
      })
    }

    return Promise.all([wsPromise, oscPromise])
  }

  async stop() {
    if (this._websocketServer) {
      this._websocketServer.close()
    }

    if (this._oscServer) {
      this._oscServer.close()
    }
  }

  /**
   * Add a listener for incomming WebSocket message
   */
  addWsListener(callback) {
    this._wsListeners.add(callback)

    return () => this._wsListeners.delete(callback)
  }

  /**
   * Remove WebSocket listener
   */
  removeWsListener(callback) {
    this._wsListeners.delete(callback)
  }

  /**
   * Add a listener for incomming OSC message
   */
  addOscListener(callback) {
    this._oscListeners.add(callback)

    return () => this._oscListeners.delete(callback)
  }

  /**
   * Remove OSC listener
   */
  removeOscListener(callback) {
    this._oscListeners.delete(callback)
  }
}
