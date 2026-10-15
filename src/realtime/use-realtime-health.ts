import { useEffect, useState } from 'react'
import { createMarketSocket } from './socket'
import type { RealtimeReadyEvent } from '../api/contracts'

export function useRealtimeHealth() {
  const [status, setStatus] = useState<'connecting' | 'ready' | 'disconnected'>('connecting')

  useEffect(() => {
    let active = true
    let stop = () => {}
    void createMarketSocket()
      .then((socket) => {
        if (!active) {
          socket.disconnect()
          return
        }
        const handleReady = (event: RealtimeReadyEvent) => {
          if (event.version === 1 && event.transport === 'socket.io') setStatus('ready')
        }
        socket.on('connect', () => socket.emit('health.check'))
        socket.on('health.ready', handleReady)
        socket.on('disconnect', () => setStatus('disconnected'))
        socket.on('connect_error', () => setStatus('disconnected'))
        socket.connect()
        stop = () => {
          socket.removeAllListeners()
          socket.disconnect()
        }
      })
      .catch(() => {
        if (active) setStatus('disconnected')
      })
    return () => {
      active = false
      stop()
    }
  }, [])

  return status
}
