import { Dark } from 'quasar'

const STORAGE_KEY = 'electrofrio_tema'
const TEMAS_VALIDOS = ['claro', 'oscuro', 'daltonico']

export const obtenerTema = () => {
  if (typeof window === 'undefined') return 'claro'
  const temaGuardado = window.localStorage.getItem(STORAGE_KEY)
  return TEMAS_VALIDOS.includes(temaGuardado) ? temaGuardado : 'claro'
}

export const aplicarTema = tema => {
  const temaSeguro = TEMAS_VALIDOS.includes(tema) ? tema : 'claro'
  Dark.set(temaSeguro === 'oscuro')

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.electrofrioTheme = temaSeguro
    document.body.classList.toggle(
      'theme-colorblind',
      temaSeguro === 'daltonico'
    )
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, temaSeguro)
  }

  return temaSeguro
}
