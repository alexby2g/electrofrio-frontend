import { boot } from 'quasar/wrappers'
import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

const api = axios.create({
  baseURL,
  timeout: 15000
})

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
