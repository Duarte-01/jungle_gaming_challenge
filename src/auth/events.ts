export const authEvents = new EventTarget()
let generation = 0
export function sessionGeneration() {
  return generation
}
export function advanceSessionGeneration() {
  generation++
}
export function notifySessionExpired() {
  authEvents.dispatchEvent(new Event('expired'))
}
export function notifyFeedback(message: string) {
  authEvents.dispatchEvent(new CustomEvent<string>('feedback', { detail: message }))
}
