export async function createMarketSocket() {
  // Called by effects only after MSW is ready; import captures the intercepted WebSocket.
  const { io } = await import('socket.io-client')
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
