import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import type { RealtimeReadyEvent } from '../api/contracts'

export function useRealtimeHealth() {
  const [status, setStatus] = useState<'connecting' | 'ready' | 'disconnected'>('connecting')

  useEffect(() => {
    const socket = io(window.location.origin, {
      path: '/realtime',
      transports: ['websocket'],
      autoConnect: false,
    })
    const handleReady = (event: RealtimeReadyEvent) => {
      if (event.version === 1 && event.transport === 'socket.io') setStatus('ready')
    }
    socket.on('connect', () => socket.emit('health.check'))
    socket.on('health.ready', handleReady)
    socket.on('disconnect', () => setStatus('disconnected'))
    socket.on('connect_error', () => setStatus('disconnected'))
    socket.connect()
    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [])

  return status
}
