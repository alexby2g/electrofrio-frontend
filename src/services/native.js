import { Capacitor } from '@capacitor/core'

const NOTIFICATIONS_KEY = 'electrofrio_notificaciones'

export const esAplicacionNativa = () => Capacitor.isNativePlatform()

export const notificacionesActivas = () =>
  esAplicacionNativa() &&
  window.localStorage.getItem(NOTIFICATIONS_KEY) === 'activas'

export const activarNotificaciones = async () => {
  if (!esAplicacionNativa()) {
    return {
      activas: false,
      mensaje:
        'Las notificaciones del dispositivo están disponibles en la app Android.'
    }
  }

  const { LocalNotifications } = await import('@capacitor/local-notifications')
  let permiso = await LocalNotifications.checkPermissions()

  if (permiso.display !== 'granted') {
    permiso = await LocalNotifications.requestPermissions()
  }

  const activas = permiso.display === 'granted'
  window.localStorage.setItem(
    NOTIFICATIONS_KEY,
    activas ? 'activas' : 'bloqueadas'
  )

  return {
    activas,
    mensaje: activas
      ? 'Notificaciones activadas correctamente.'
      : 'Android no autorizó las notificaciones. Puedes habilitarlas desde Ajustes.'
  }
}

export const desactivarNotificaciones = () => {
  window.localStorage.setItem(NOTIFICATIONS_KEY, 'bloqueadas')
}

export const notificarEvento = async ({ titulo, mensaje, extra = {} }) => {
  if (!notificacionesActivas()) return false

  const { LocalNotifications } = await import('@capacitor/local-notifications')
  await LocalNotifications.schedule({
    notifications: [
      {
        id: Math.floor(Date.now() % 2147483647),
        title: titulo,
        body: mensaje,
        schedule: { at: new Date(Date.now() + 500) },
        extra
      }
    ]
  })
  return true
}

const normalizarTelefono = telefono =>
  String(telefono || '')
    .replace(/[^\d+]/g, '')
    .trim()

export const importarContactos = async () => {
  if (!esAplicacionNativa()) {
    throw new Error(
      'La importación de contactos solo está disponible en la app Android.'
    )
  }

  const { Contacts } = await import('@capacitor-community/contacts')
  let permiso = await Contacts.checkPermissions()

  if (permiso.contacts !== 'granted') {
    permiso = await Contacts.requestPermissions()
  }

  if (permiso.contacts !== 'granted') {
    throw new Error('Android no autorizó el acceso a los contactos.')
  }

  const resultado = await Contacts.getContacts({
    projection: {
      name: true,
      phones: true
    }
  })

  return (resultado.contacts || [])
    .map(contacto => {
      const nombre =
        contacto.name?.display ||
        [contacto.name?.given, contacto.name?.middle, contacto.name?.family]
          .filter(Boolean)
          .join(' ')
          .trim()
      const telefono = normalizarTelefono(
        contacto.phones?.find(item => item.isPrimary)?.number ||
          contacto.phones?.[0]?.number
      )

      return {
        id: contacto.contactId,
        nombre,
        telefono
      }
    })
    .filter(contacto => contacto.nombre && contacto.telefono)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}
