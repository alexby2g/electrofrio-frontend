const BOLIVIA_COUNTRY_CODE = '591'

export const normalizarTelefonoWhatsApp = telefono => {
  const digitos = String(telefono || '').replace(/\D/g, '')

  if (!digitos) return ''
  if (digitos.startsWith(BOLIVIA_COUNTRY_CODE)) return digitos
  if (digitos.length === 8) return `${BOLIVIA_COUNTRY_CODE}${digitos}`

  return digitos
}

export const crearEnlaceWhatsApp = (telefono, mensaje) => {
  const numero = normalizarTelefonoWhatsApp(telefono)
  const texto = String(mensaje || '').trim()

  if (!numero) {
    throw new Error('Indica un teléfono válido para abrir WhatsApp Business.')
  }

  if (!texto) {
    throw new Error('Escribe el mensaje que deseas enviar.')
  }

  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

export const abrirWhatsAppBusiness = (telefono, mensaje, ventana = null) => {
  const enlace = crearEnlaceWhatsApp(telefono, mensaje)

  if (ventana && !ventana.closed) {
    ventana.location.href = enlace
    return enlace
  }

  const nuevaVentana = window.open('', '_blank')

  if (nuevaVentana) {
    nuevaVentana.opener = null
    nuevaVentana.location.href = enlace
  } else {
    window.location.assign(enlace)
  }

  return enlace
}
