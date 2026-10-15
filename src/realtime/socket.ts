import { io } from 'socket.io-client'

export function createMarketSocket() {
  return io(window.location.origin, {
    path: '/realtime',
    transports: ['websocket'],
    autoConnect: false,
    forceNew: true,
    timeout: 1000,
    reconnectionDelay: 250,
    reconnectionDelayMax: 1000,
    randomizationFactor: 0,
  })
}
