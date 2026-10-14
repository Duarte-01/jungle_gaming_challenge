import axios from 'axios'

// Componentes nunca devem receber fixtures diretamente: REST sempre passa aqui.
export const api = axios.create({ baseURL: '/api', timeout: 10_000 })
