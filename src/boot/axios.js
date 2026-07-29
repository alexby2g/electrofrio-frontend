import { boot } from 'quasar/wrappers'
import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_URL || 'https://electrofrio-api.onrender.com/api').replace(/\/$/, '')

const api = axios.create({
  baseURL,
  timeout: 15000
})

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
