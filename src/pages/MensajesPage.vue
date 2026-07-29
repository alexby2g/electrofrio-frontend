<template>
  <q-page class="messages-page q-pa-md q-pa-lg-lg">
    <div
      class="page-heading row items-center justify-between q-mb-lg q-gutter-md"
    >
      <div>
        <div class="text-h4 text-weight-bold text-blue-grey-10">Mensajes</div>
        <div class="text-body1 text-grey-7">
          Comunicación y seguimiento de atenciones
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-chip
          dense
          :color="colorEstadoWhatsApp"
          :text-color="whatsappEstado.conectado ? 'white' : 'grey-9'"
          :icon="whatsappEstado.conectado ? 'check_circle' : 'settings'"
          :label="textoEstadoWhatsApp"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add_comment"
          label="Nueva conversación"
          @click="abrirNuevaConversacion"
        />
      </div>
    </div>

    <q-card flat bordered class="messages-shell">
      <div class="conversations-panel">
        <div class="q-pa-md conversations-search">
          <q-input
            v-model.trim="buscar"
            dense
            outlined
            clearable
            placeholder="Buscar conversación"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>

        <q-scroll-area class="conversations-scroll">
          <q-list separator>
            <q-item
              v-for="item in conversacionesFiltradas"
              :key="item.id"
              clickable
              v-ripple
              :active="item.id === conversacionActiva?.id"
              active-class="conversation-active"
              class="conversation-item q-py-md"
              @click="seleccionarConversacion(item)"
            >
              <q-item-section avatar>
                <q-avatar color="cyan-8" text-color="white">
                  {{ iniciales(nombreConversacion(item)) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold ellipsis">
                  {{ nombreConversacion(item) }}
                </q-item-label>
                <q-item-label caption class="ellipsis">
                  {{ item.ultimo_mensaje?.contenido || item.asunto }}
                </q-item-label>
                <div class="row q-gutter-xs q-mt-xs">
                  <q-badge
                    v-if="item.cita_id"
                    outline
                    color="primary"
                    :label="`Atención #EF-${String(item.cita_id).padStart(3, '0')}`"
                  />
                  <q-badge
                    v-if="item.cita?.estado"
                    outline
                    :color="colorEstado(item.cita.estado)"
                    :label="textoEstado(item.cita.estado)"
                  />
                </div>
              </q-item-section>
              <q-item-section side top>
                <div class="text-caption text-grey-6">
                  {{ horaCorta(item.ultimo_mensaje_at || item.updated_at) }}
                </div>
                <q-badge
                  v-if="item.no_leidos"
                  rounded
                  color="negative"
                  :label="item.no_leidos"
                  class="q-mt-sm"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <div
            v-if="!cargandoConversaciones && !conversacionesFiltradas.length"
            class="column items-center q-pa-xl text-grey-6"
          >
            <q-icon name="forum" size="48px" />
            <div class="q-mt-md">No hay conversaciones todavía.</div>
          </div>
        </q-scroll-area>
      </div>

      <div v-if="conversacionActiva" class="chat-panel">
        <div class="chat-header row items-center no-wrap q-pa-md">
          <q-avatar color="cyan-8" text-color="white" class="q-mr-md">
            {{ iniciales(nombreConversacion(conversacionActiva)) }}
          </q-avatar>
          <div class="col">
            <div class="text-subtitle1 text-weight-bold">
              {{ nombreConversacion(conversacionActiva) }}
            </div>
            <div class="text-caption text-grey-7">
              {{ conversacionActiva.asunto }}
            </div>
          </div>
          <q-chip
            v-if="conversacionActiva.cita?.estado"
            dense
            :color="`${colorEstado(conversacionActiva.cita.estado)}-1`"
            :text-color="colorEstado(conversacionActiva.cita.estado)"
            :label="textoEstado(conversacionActiva.cita.estado)"
          />
        </div>

        <q-scroll-area ref="chatScroll" class="chat-scroll">
          <div class="q-pa-md q-pa-lg-md">
            <div v-if="cargandoMensajes" class="row justify-center q-pa-xl">
              <q-spinner-dots color="primary" size="42px" />
            </div>

            <template v-else>
              <div
                v-for="mensaje in mensajes"
                :key="mensaje.id"
                class="message-row"
                :class="{ 'message-row--mine': esMio(mensaje) }"
              >
                <div
                  class="message-bubble"
                  :class="
                    esMio(mensaje)
                      ? 'message-bubble--mine'
                      : 'message-bubble--other'
                  "
                >
                  <div
                    v-if="!esMio(mensaje)"
                    class="text-caption text-weight-bold text-primary q-mb-xs"
                  >
                    {{ mensaje.remitente?.name || 'Cliente por WhatsApp' }}
                  </div>
                  <div v-if="mensaje.contenido" class="message-copy">
                    {{ mensaje.contenido }}
                  </div>
                  <a
                    v-if="mensaje.archivo_url"
                    :href="mensaje.archivo_url"
                    target="_blank"
                    class="message-file row items-center no-wrap q-mt-sm"
                  >
                    <q-icon
                      :name="
                        mensaje.archivo_tipo?.startsWith('image/')
                          ? 'image'
                          : 'description'
                      "
                      size="26px"
                      class="q-mr-sm"
                    />
                    <span class="ellipsis">{{ mensaje.archivo_nombre }}</span>
                  </a>
                  <div class="row items-center justify-end q-gutter-xs q-mt-xs">
                    <q-icon
                      v-if="mensaje.canal === 'whatsapp'"
                      name="chat"
                      color="green-7"
                      size="15px"
                    />
                    <span class="text-caption text-grey-6">
                      {{ horaCorta(mensaje.enviado_at || mensaje.created_at) }}
                    </span>
                    <q-icon
                      v-if="esMio(mensaje)"
                      :name="iconoEstadoMensaje(mensaje)"
                      :color="colorEstadoMensaje(mensaje)"
                      size="16px"
                    >
                      <q-tooltip>{{ textoEstadoMensaje(mensaje) }}</q-tooltip>
                    </q-icon>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </q-scroll-area>

        <div class="chat-composer q-pa-md">
          <q-banner
            v-if="errorEnvio"
            dense
            rounded
            class="bg-red-1 text-negative q-mb-sm"
          >
            {{ errorEnvio }}
          </q-banner>
          <div class="row items-end no-wrap q-gutter-sm">
            <q-file
              v-model="archivo"
              dense
              outlined
              clearable
              accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
              max-file-size="10485760"
              class="attachment-input"
              :disable="canal === 'whatsapp'"
            >
              <template #prepend><q-icon name="attach_file" /></template>
            </q-file>
            <q-input
              v-model="nuevoMensaje"
              outlined
              autogrow
              class="col"
              placeholder="Escribe un mensaje…"
              @keydown.enter.exact.prevent="enviarMensaje"
            />
            <q-btn
              round
              unelevated
              color="primary"
              icon="send"
              :loading="enviando"
              :disable="envioDeshabilitado"
              @click="enviarMensaje"
            />
          </div>
          <div class="channel-row row items-center q-mt-sm">
            <q-btn-toggle
              v-model="canal"
              no-caps
              dense
              unelevated
              toggle-color="primary"
              color="grey-2"
              text-color="grey-8"
              :options="opcionesCanal"
            />
            <div
              class="text-caption q-ml-md"
              :class="
                whatsappEstado.conectado ? 'text-positive' : 'text-grey-7'
              "
            >
              {{ ayudaWhatsApp }}
            </div>
          </div>
        </div>
      </div>

      <div v-else class="chat-empty column flex-center">
        <q-icon name="mark_chat_unread" size="78px" color="blue-grey-3" />
        <div class="text-h6 text-grey-7 q-mt-md">
          Selecciona una conversación
        </div>
        <div class="text-body2 text-grey-6">
          Los mensajes se actualizarán automáticamente.
        </div>
      </div>

      <aside v-if="conversacionActiva" class="details-panel q-pa-lg">
        <div class="text-h6 text-weight-bold q-mb-lg">
          Detalle de la atención
        </div>

        <template v-if="conversacionActiva.cita">
          <detail-row
            icon="person_outline"
            label="Cliente"
            :value="conversacionActiva.cita.cliente?.nombre || 'Sin cliente'"
          />
          <detail-row
            icon="devices_other"
            label="Equipo"
            :value="nombreEquipo(conversacionActiva.cita.equipo)"
          />
          <detail-row
            icon="engineering"
            label="Técnico"
            :value="conversacionActiva.cita.tecnico?.nombre || 'Sin asignar'"
          />
          <detail-row
            icon="pending_actions"
            label="Estado"
            :value="textoEstado(conversacionActiva.cita.estado)"
          />
          <detail-row
            icon="account_balance_wallet"
            label="Saldo pendiente"
            :value="`Bs ${saldoPendiente.toFixed(2)}`"
            value-class="text-negative"
          />

          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="assignment"
            label="Ver atención completa"
            class="full-width q-mt-lg"
            @click="$router.push('/citas')"
          />
        </template>

        <div v-else class="text-grey-6">
          <div>Esta es una conversación general sin atención vinculada.</div>
          <div v-if="conversacionActiva.canal_externo_id" class="q-mt-md">
            <strong>Teléfono:</strong> {{ conversacionActiva.canal_externo_id }}
          </div>
        </div>
      </aside>
    </q-card>

    <q-dialog v-model="dialogoNueva">
      <q-card style="width: min(620px, 94vw)">
        <q-card-section class="row items-center">
          <div class="text-h6">Nueva conversación</div>
          <q-space />
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>
        <q-separator />
        <q-form @submit.prevent="crearConversacion">
          <q-card-section class="q-gutter-md">
            <q-select
              v-model="nueva.cita_id"
              outlined
              clearable
              emit-value
              map-options
              label="Atención relacionada"
              :options="opcionesCitas"
              :loading="cargandoCitas"
            />
            <q-input
              v-model.trim="nueva.asunto"
              outlined
              label="Asunto"
              :rules="[valor => Boolean(valor) || 'El asunto es obligatorio']"
            />
            <q-select
              v-model="nueva.tipo"
              outlined
              emit-value
              map-options
              label="Tipo de conversación"
              :options="[
                { label: 'Interna', value: 'interna' },
                { label: 'WhatsApp', value: 'whatsapp' }
              ]"
            />
            <q-input
              v-if="nueva.tipo === 'whatsapp'"
              v-model.trim="nueva.telefono_destino"
              outlined
              label="Teléfono destino"
              hint="Puedes dejarlo vacío si la atención ya tiene un cliente con teléfono."
              placeholder="+59170000000"
            />
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancelar" />
            <q-btn
              unelevated
              no-caps
              color="primary"
              label="Crear conversación"
              type="submit"
              :loading="creando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, h } from 'vue'

const DetailRow = defineComponent({
  name: 'DetailRow',
  props: {
    icon: String,
    label: String,
    value: String,
    valueClass: String
  },
  setup(props) {
    return () =>
      h('div', { class: 'detail-row row no-wrap q-py-md' }, [
        h(
          'i',
          {
            class: `q-icon material-icons text-primary q-mr-md`,
            style: 'font-size: 28px'
          },
          props.icon
        ),
        h('div', { class: 'col' }, [
          h('div', { class: 'text-caption text-grey-7' }, props.label),
          h(
            'div',
            {
              class: `text-body1 text-weight-medium ${props.valueClass || ''}`
            },
            props.value
          )
        ])
      ])
  }
})

export default defineComponent({
  name: 'MensajesPage',
  components: { DetailRow }
})
</script>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import api, { extraerMensajeError } from '../services/api.js'
import { obtenerUsuario } from '../services/auth.js'

const $q = useQuasar()
const usuario = obtenerUsuario()
const buscar = ref('')
const conversaciones = ref([])
const conversacionActiva = ref(null)
const mensajes = ref([])
const nuevoMensaje = ref('')
const archivo = ref(null)
const canal = ref('interno')
const cargandoConversaciones = ref(false)
const cargandoMensajes = ref(false)
const enviando = ref(false)
const errorEnvio = ref('')
const dialogoNueva = ref(false)
const citas = ref([])
const cargandoCitas = ref(false)
const creando = ref(false)
const whatsappEstado = reactive({
  cargando: true,
  configurado: false,
  conectado: false,
  webhook_configurado: false,
  version: null,
  numero_id_mascara: null
})
let temporizador = null

const nueva = reactive({
  cita_id: null,
  asunto: '',
  tipo: 'interna',
  telefono_destino: ''
})

const conversacionesFiltradas = computed(() => {
  const texto = buscar.value.toLowerCase()
  if (!texto) return conversaciones.value
  return conversaciones.value.filter(item =>
    [item.asunto, nombreConversacion(item), item.ultimo_mensaje?.contenido]
      .filter(Boolean)
      .some(valor => String(valor).toLowerCase().includes(texto))
  )
})

const opcionesCitas = computed(() =>
  citas.value.map(cita => ({
    value: cita.id,
    label: `#EF-${String(cita.id).padStart(3, '0')} · ${
      cita.cliente?.nombre || 'Sin cliente'
    } · ${textoEstado(cita.estado)}`
  }))
)

const saldoPendiente = computed(() => {
  const cita = conversacionActiva.value?.cita
  if (!cita) return 0
  const pagado = (cita.pagos || [])
    .filter(item => item.estado === 'pagado')
    .reduce((total, item) => total + Number(item.monto || 0), 0)
  return Math.max(Number(cita.total || 0) - pagado, 0)
})

const opcionesCanal = computed(() => [
  { label: 'Interno', value: 'interno', icon: 'forum' },
  {
    label: 'WhatsApp',
    value: 'whatsapp',
    icon: 'chat',
    disable: !whatsappEstado.conectado
  }
])

const envioDeshabilitado = computed(
  () =>
    (!nuevoMensaje.value.trim() && !archivo.value) ||
    (canal.value === 'whatsapp' && !whatsappEstado.conectado)
)

const textoEstadoWhatsApp = computed(() => {
  if (whatsappEstado.cargando) return 'Comprobando WhatsApp'
  if (whatsappEstado.conectado && whatsappEstado.webhook_configurado) {
    return 'WhatsApp conectado'
  }
  if (whatsappEstado.conectado) return 'Envío activo · webhook pendiente'
  if (whatsappEstado.configurado) return 'Credenciales sin conexión'
  return 'WhatsApp no configurado'
})

const colorEstadoWhatsApp = computed(() => {
  if (whatsappEstado.cargando) return 'blue-grey-2'
  if (whatsappEstado.conectado && whatsappEstado.webhook_configurado)
    return 'positive'
  if (whatsappEstado.conectado || whatsappEstado.configurado) return 'warning'
  return 'grey-3'
})

const ayudaWhatsApp = computed(() => {
  if (whatsappEstado.cargando) return 'Comprobando la conexión con Meta…'
  if (whatsappEstado.conectado && whatsappEstado.webhook_configurado) {
    return `Meta conectado${whatsappEstado.numero ? ` · ${whatsappEstado.numero}` : ''}.`
  }
  if (whatsappEstado.conectado) {
    return 'El envío está activo; falta completar el webhook de recepción.'
  }
  if (whatsappEstado.configurado) {
    return 'Meta rechazó las credenciales o no respondió. Revisa el token y el número.'
  }
  return 'Usa el chat interno hasta agregar las credenciales de Meta en Render.'
})

onMounted(async () => {
  await Promise.all([cargarIntegracionWhatsApp(), cargarConversaciones()])
  temporizador = window.setInterval(actualizar, 5000)
})

onUnmounted(() => {
  if (temporizador) window.clearInterval(temporizador)
})

const cargarConversaciones = async () => {
  cargandoConversaciones.value = true
  try {
    const { data } = await api.get('/conversaciones')
    conversaciones.value = data

    if (conversacionActiva.value) {
      const actualizada = data.find(
        item => item.id === conversacionActiva.value.id
      )
      if (actualizada) conversacionActiva.value = actualizada
    } else if (data.length) {
      await seleccionarConversacion(data[0])
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(error, 'No se pudieron cargar los mensajes.')
    })
  } finally {
    cargandoConversaciones.value = false
  }
}

const cargarIntegracionWhatsApp = async () => {
  whatsappEstado.cargando = true
  try {
    const { data } = await api.get('/integraciones/whatsapp/estado')
    Object.assign(whatsappEstado, data)
  } catch {
    whatsappEstado.configurado = false
    whatsappEstado.conectado = false
    whatsappEstado.webhook_configurado = false
  } finally {
    whatsappEstado.cargando = false
    if (!whatsappEstado.conectado && canal.value === 'whatsapp') {
      canal.value = 'interno'
    } else if (
      whatsappEstado.conectado &&
      conversacionActiva.value?.tipo === 'whatsapp'
    ) {
      canal.value = 'whatsapp'
    }
  }
}

const seleccionarConversacion = async item => {
  conversacionActiva.value = item
  cargandoMensajes.value = true
  errorEnvio.value = ''
  try {
    const { data } = await api.get(`/conversaciones/${item.id}`)
    conversacionActiva.value = data.conversacion
    mensajes.value = data.mensajes
    canal.value =
      data.conversacion.tipo === 'whatsapp' && whatsappEstado.conectado
        ? 'whatsapp'
        : 'interno'
    await api.post(`/conversaciones/${item.id}/leer`)
    item.no_leidos = 0
    await desplazarAlFinal()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(error, 'No se pudo abrir la conversación.')
    })
  } finally {
    cargandoMensajes.value = false
  }
}

const actualizar = async () => {
  if (document.hidden) return

  if (conversacionActiva.value) {
    const cantidadAnterior = mensajes.value.length
    try {
      const { data } = await api.get(
        `/conversaciones/${conversacionActiva.value.id}`
      )
      mensajes.value = data.mensajes
      conversacionActiva.value = data.conversacion
      if (data.mensajes.length > cantidadAnterior) {
        await api.post(`/conversaciones/${conversacionActiva.value.id}/leer`)
        await desplazarAlFinal()
      }
    } catch {
      // El siguiente ciclo reintentará sin interrumpir al usuario.
    }
  }

  try {
    const { data } = await api.get('/conversaciones')
    conversaciones.value = data
  } catch {
    // Se conserva la información visible si hay un corte de red.
  }
}

const enviarMensaje = async () => {
  if ((!nuevoMensaje.value.trim() && !archivo.value) || enviando.value) return

  enviando.value = true
  errorEnvio.value = ''
  const formData = new FormData()
  formData.append('canal', canal.value)
  if (nuevoMensaje.value.trim())
    formData.append('contenido', nuevoMensaje.value.trim())
  if (archivo.value) formData.append('archivo', archivo.value)

  try {
    const { data } = await api.post(
      `/conversaciones/${conversacionActiva.value.id}/mensajes`,
      formData
    )
    mensajes.value.push(data.data)
    nuevoMensaje.value = ''
    archivo.value = null
    await desplazarAlFinal()
    await cargarConversaciones()
  } catch (error) {
    errorEnvio.value = extraerMensajeError(
      error,
      'No se pudo enviar el mensaje.'
    )
  } finally {
    enviando.value = false
  }
}

const abrirNuevaConversacion = async () => {
  dialogoNueva.value = true
  cargandoCitas.value = true
  try {
    const { data } = await api.get('/citas')
    citas.value = data.data || []
  } finally {
    cargandoCitas.value = false
  }
}

const crearConversacion = async () => {
  creando.value = true
  try {
    const { data } = await api.post('/conversaciones', nueva)
    dialogoNueva.value = false
    nueva.cita_id = null
    nueva.asunto = ''
    nueva.tipo = 'interna'
    nueva.telefono_destino = ''
    await cargarConversaciones()
    await seleccionarConversacion(data.conversacion)
    $q.notify({ type: 'positive', message: 'Conversación creada.' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(error, 'No se pudo crear la conversación.')
    })
  } finally {
    creando.value = false
  }
}

const desplazarAlFinal = async () => {
  await nextTick()
  const area = document.querySelector('.chat-scroll .q-scrollarea__container')
  if (area) area.scrollTop = area.scrollHeight
}

const esMio = mensaje => Number(mensaje.remitente_id) === Number(usuario?.id)
const iconoEstadoMensaje = mensaje => {
  if (mensaje.canal !== 'whatsapp') return 'done'

  return (
    {
      aceptado: 'schedule',
      enviado: 'done',
      entregado: 'done_all',
      leido: 'done_all',
      fallido: 'error'
    }[mensaje.estado] || 'schedule'
  )
}
const colorEstadoMensaje = mensaje => {
  if (mensaje.canal !== 'whatsapp') return 'blue-grey-5'

  return (
    {
      aceptado: 'blue-grey-5',
      enviado: 'blue-grey-6',
      entregado: 'light-blue-6',
      leido: 'light-blue-8',
      fallido: 'negative'
    }[mensaje.estado] || 'blue-grey-5'
  )
}
const textoEstadoMensaje = mensaje => {
  if (mensaje.canal !== 'whatsapp') return 'Guardado en el chat interno'

  return (
    {
      aceptado: 'Aceptado por Meta',
      enviado: 'Enviado por WhatsApp',
      entregado: 'Entregado al teléfono',
      leido: 'Leído por el cliente',
      fallido: 'No se pudo entregar'
    }[mensaje.estado] || 'Procesando en WhatsApp'
  )
}
const nombreConversacion = item =>
  item?.cita?.cliente?.nombre || item?.asunto || 'Conversación'
const iniciales = texto =>
  String(texto || 'EF')
    .split(' ')
    .slice(0, 2)
    .map(item => item[0])
    .join('')
    .toUpperCase()
const horaCorta = fecha =>
  fecha
    ? new Intl.DateTimeFormat('es-BO', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(fecha))
    : ''
const nombreEquipo = equipo =>
  equipo
    ? [equipo.tipo, equipo.marca, equipo.modelo].filter(Boolean).join(' ')
    : 'Sin equipo'

const estados = {
  pendiente: ['Pendiente', 'warning'],
  revision: ['En revisión', 'info'],
  en_proceso: ['En proceso', 'primary'],
  esperando_repuesto: ['Esperando repuesto', 'deep-orange'],
  terminado: ['Terminado', 'positive'],
  entregado: ['Entregado', 'teal'],
  concluida: ['Concluida', 'positive'],
  cancelada: ['Cancelada', 'negative']
}
const textoEstado = estado => estados[estado]?.[0] || estado || 'Sin estado'
const colorEstado = estado => estados[estado]?.[1] || 'grey'
</script>

<style scoped>
.messages-page {
  min-height: calc(100vh - 50px);
  padding-top: 28px !important;
  background: #f2f7f9;
}

.messages-shell {
  display: grid;
  grid-template-columns: 330px minmax(420px, 1fr) 300px;
  min-height: calc(100vh - 160px);
  overflow: hidden;
  border-radius: 18px;
  background: white;
}

.conversations-panel,
.chat-panel {
  min-width: 0;
  border-right: 1px solid #dbe7eb;
}

.conversations-search,
.chat-header,
.chat-composer {
  border-bottom: 1px solid #dbe7eb;
  background: white;
}

.conversations-scroll,
.chat-scroll {
  height: calc(100vh - 250px);
}

.conversation-item {
  min-height: 92px;
}

.conversation-active {
  background: #e2f7fa;
  color: #0b5363;
}

.chat-panel {
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.chat-scroll {
  height: auto;
  min-height: 0;
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(11, 127, 146, 0.05),
      transparent 32%
    ),
    #f7fafb;
}

.message-row {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 14px;
}

.message-row--mine {
  justify-content: flex-end;
}

.message-bubble {
  max-width: min(76%, 620px);
  padding: 11px 14px 7px;
  border-radius: 14px;
  box-shadow: 0 3px 10px rgba(16, 42, 67, 0.08);
}

.message-bubble--other {
  border: 1px solid #dbe7eb;
  background: white;
  border-bottom-left-radius: 4px;
}

.message-bubble--mine {
  border: 1px solid #b6e5eb;
  background: #dff5f8;
  border-bottom-right-radius: 4px;
}

.message-copy {
  white-space: pre-wrap;
  word-break: break-word;
}

.message-file {
  max-width: 320px;
  padding: 10px;
  border-radius: 9px;
  color: #0b6677;
  background: rgba(255, 255, 255, 0.72);
  text-decoration: none;
}

.attachment-input {
  width: 54px;
}

.attachment-input :deep(.q-field__native) {
  display: none;
}

.details-panel {
  min-width: 0;
  background: #fbfdfe;
}

.detail-row {
  border-bottom: 1px solid #e1eaed;
}

.chat-empty {
  min-height: 500px;
  border-right: 1px solid #dbe7eb;
}

@media (max-width: 1180px) {
  .messages-shell {
    grid-template-columns: 310px 1fr;
  }

  .details-panel {
    display: none;
  }
}

@media (max-width: 800px) {
  .messages-page {
    padding-top: 18px !important;
  }

  .page-heading {
    align-items: flex-start;
  }

  .messages-shell {
    display: block;
  }

  .conversations-panel {
    max-height: 330px;
    border-right: 0;
    border-bottom: 1px solid #dbe7eb;
  }

  .conversations-scroll {
    height: 245px;
  }

  .chat-panel {
    min-height: 620px;
    border-right: 0;
  }

  .message-bubble {
    max-width: 88%;
  }

  .channel-row {
    align-items: flex-start;
  }
}
</style>
