import axios from 'axios'
import { limpiarSesion, obtenerToken } from './auth.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://electrofrio-api.onrender.com/api',
  timeout: 15000
})

api.interceptors.request.use(config => {
  const token = obtenerToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401) {
      limpiarSesion()

      if (
        typeof window !== 'undefined' &&
        !window.location.hash.includes('/login')
      ) {
        window.location.replace(`${window.location.pathname}#/login`)
      }
    }

    return Promise.reject(error)
  }
)

export const extraerMensajeError = (
  error,
  mensajeDefault = 'Ocurrió un error inesperado'
) => {
  const data = error?.response?.data
  const textoError = String(
    data?.message || data?.mensaje || error?.message || ''
  )

  if (
    textoError.includes("Unknown column 'equipo_id'") ||
    textoError.includes('Unknown column equipo_id')
  ) {
    return 'La base de datos todavía no tiene la columna equipo_id en citas. Ejecuta: php artisan migrate. Si usas HeidiSQL, corre el SQL de database/sql/actualizar_citas_equipo_id.sql.'
  }

  if (
    textoError.includes("Unknown column 'estado_equipo'") ||
    textoError.includes("Unknown column 'garantia'") ||
    textoError.includes("Unknown column 'recomendaciones'") ||
    textoError.includes("Unknown column 'fecha_entrega'")
  ) {
    return 'La base de datos todavía no tiene los campos nuevos del detalle técnico. Ejecuta: php artisan migrate. Si usas HeidiSQL, corre database/sql/actualizar_detalle_tecnico_documentos.sql.'
  }

  if (
    textoError.includes("Unknown column 'evidencias'") ||
    textoError.includes('Unknown column evidencias')
  ) {
    return 'La base de datos todavía no tiene el campo evidencias para las fotos. Ejecuta: php artisan migrate. Si usas HeidiSQL, corre database/sql/actualizar_evidencias_detalle_tecnico.sql.'
  }

  if (data?.message) return data.message
  if (data?.mensaje) return data.mensaje

  const errores = data?.errors
  if (errores) {
    const primerCampo = Object.keys(errores)[0]
    if (primerCampo && errores[primerCampo]?.[0]) return errores[primerCampo][0]
  }

  return mensajeDefault
}

export default api
