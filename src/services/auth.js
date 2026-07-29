const TOKEN_KEY = 'electrofrio_token'
const USER_KEY = 'electrofrio_usuario'

const almacenamientoDisponible = () =>
  typeof window !== 'undefined' && window.localStorage

export const obtenerToken = () => {
  if (!almacenamientoDisponible()) return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export const obtenerUsuario = () => {
  if (!almacenamientoDisponible()) return null

  try {
    return JSON.parse(window.localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export const guardarSesion = ({ token, usuario }) => {
  if (!almacenamientoDisponible()) return

  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(usuario))
}

export const limpiarSesion = () => {
  if (!almacenamientoDisponible()) return

  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

export const haySesion = () => Boolean(obtenerToken())
