export interface HealthResponse {
  status: 'ok'
  service: 'jungle-marketplace-mock'
}

export interface RealtimeReadyEvent {
  id: string
  version: number
  transport: 'socket.io'
}
