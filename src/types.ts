export type ComoteData = {
  source: 'comote'
  id: string | number
  devicemotion: {
    interval: number
    accelerationIncludingGravity: {
      x: number
      y: number
      z: number
    }
    rotationRate: {
      alpha: number
      beta: number
      gamma: number
    }
  }
}

export type ComoteServerConfig = {
  interval: number
  ws?: {
    protocol?: 'ws' | 'wss'
    hostname: string
    port: number
    pathname?: string
    autostart?: boolean
  }
  osc?: {
    hostname: string
    port: number
    autostart?: boolean
  }
}
