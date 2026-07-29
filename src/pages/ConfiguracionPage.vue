<template>
  <q-page class="q-pa-md page-shell">
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Configuración</div>
        <div class="text-subtitle2 text-grey-7">
          Catálogos, personal, accesos e integraciones en un solo lugar
        </div>
      </div>
      <q-btn
        outline
        color="primary"
        icon="refresh"
        label="Comprobar integraciones"
        :loading="loading"
        @click="cargarEstado"
      />
    </div>

    <q-banner rounded class="bg-blue-1 text-primary q-mb-md">
      <template #avatar><q-icon name="tune" /></template>
      Estas opciones cambian la forma de trabajar del sistema. Los clientes,
      equipos, atenciones y cobros se administran desde los módulos diarios.
    </q-banner>

    <div class="row q-col-gutter-md">
      <div v-if="esAplicacionNativa()" class="col-12 col-md-6 col-lg-4">
        <q-card class="content-card full-height config-card">
          <q-card-section>
            <div class="row items-start no-wrap">
              <q-avatar color="accent" text-color="white" size="50px">
                <q-icon name="notifications_active" />
              </q-avatar>
              <div class="q-ml-md">
                <div class="text-h6 text-weight-bold">
                  Notificaciones Android
                </div>
                <div class="text-body2 text-grey-7 q-mt-xs">
                  Avisa al iniciar sesión y cuando registras clientes o pagos.
                </div>
              </div>
            </div>
          </q-card-section>
          <q-card-section>
            <q-chip
              :color="notificacionesHabilitadas ? 'positive' : 'warning'"
              text-color="white"
              :icon="
                notificacionesHabilitadas
                  ? 'notifications_active'
                  : 'notifications_off'
              "
            >
              {{
                notificacionesHabilitadas
                  ? 'Notificaciones activadas'
                  : 'Notificaciones desactivadas'
              }}
            </q-chip>
          </q-card-section>
          <q-space />
          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              color="primary"
              icon="notifications_active"
              label="Activar notificaciones"
              @click="habilitarNotificaciones"
            />
          </q-card-actions>
        </q-card>
      </div>

      <div
        v-for="opcion in opciones"
        :key="opcion.titulo"
        class="col-12 col-md-6 col-lg-4"
      >
        <q-card class="content-card full-height config-card">
          <q-card-section>
            <div class="row items-start no-wrap">
              <q-avatar :color="opcion.color" text-color="white" size="50px">
                <q-icon :name="opcion.icono" />
              </q-avatar>
              <div class="q-ml-md">
                <div class="text-h6 text-weight-bold">{{ opcion.titulo }}</div>
                <div class="text-body2 text-grey-7 q-mt-xs">
                  {{ opcion.descripcion }}
                </div>
              </div>
            </div>
          </q-card-section>
          <q-space />
          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              color="primary"
              :icon="opcion.icono"
              :label="opcion.accion"
              :to="opcion.to"
            />
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-12 col-md-6 col-lg-4">
        <q-card class="content-card full-height config-card">
          <q-card-section>
            <div class="row items-start no-wrap">
              <q-avatar color="positive" text-color="white" size="50px">
                <q-icon name="chat" />
              </q-avatar>
              <div class="q-ml-md">
                <div class="text-h6 text-weight-bold">WhatsApp Business</div>
                <div class="text-body2 text-grey-7 q-mt-xs">
                  Estado de Meta Cloud API para enviar y recibir mensajes.
                </div>
              </div>
            </div>
          </q-card-section>
          <q-card-section>
            <div class="row q-gutter-sm">
              <q-chip
                :color="whatsapp.configurado ? 'positive' : 'warning'"
                text-color="white"
                :icon="whatsapp.configurado ? 'check_circle' : 'pending'"
              >
                {{
                  whatsapp.configurado ? 'Envío configurado' : 'Envío pendiente'
                }}
              </q-chip>
              <q-chip
                :color="whatsapp.webhook_configurado ? 'positive' : 'warning'"
                text-color="white"
                :icon="whatsapp.webhook_configurado ? 'sync' : 'sync_disabled'"
              >
                {{
                  whatsapp.webhook_configurado
                    ? 'Webhook configurado'
                    : 'Webhook pendiente'
                }}
              </q-chip>
            </div>
            <div class="text-caption text-grey-7 q-mt-sm">
              API {{ whatsapp.version || 'sin verificar' }}
              <span v-if="whatsapp.numero_id_mascara">
                · Número {{ whatsapp.numero_id_mascara }}
              </span>
            </div>
          </q-card-section>
          <q-space />
          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              flat
              color="primary"
              icon="forum"
              label="Ir a mensajes"
              to="/mensajes"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <q-banner v-if="error" rounded class="bg-orange-1 text-orange-10 q-mt-md">
      {{ error }}
    </q-banner>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api, { extraerMensajeError } from '../services/api.js'
import { obtenerUsuario } from '../services/auth.js'
import {
  activarNotificaciones,
  esAplicacionNativa,
  notificacionesActivas
} from '../services/native.js'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const loading = ref(false)
const error = ref('')
const whatsapp = ref({})
const notificacionesHabilitadas = ref(notificacionesActivas())
const esAdministrador = computed(
  () => obtenerUsuario()?.rol === 'administrador'
)

const opciones = computed(() => [
  {
    titulo: 'Servicios y precios',
    descripcion:
      'Define mantenimientos, reparaciones y precios sugeridos para las atenciones.',
    accion: 'Administrar servicios',
    icono: 'home_repair_service',
    color: 'primary',
    to: '/servicios'
  },
  {
    titulo: 'Personal técnico',
    descripcion:
      'Registra técnicos, especialidades, teléfonos y disponibilidad.',
    accion: 'Administrar técnicos',
    icono: 'engineering',
    color: 'info',
    to: '/tecnicos'
  },
  ...(esAdministrador.value
    ? [
        {
          titulo: 'Usuarios y permisos',
          descripcion:
            'Controla quién ingresa y qué rol utiliza dentro de Electro Frío.',
          accion: 'Administrar usuarios',
          icono: 'manage_accounts',
          color: 'deep-purple',
          to: '/usuarios'
        }
      ]
    : [])
])

const cargarEstado = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/integraciones/whatsapp/estado')
    whatsapp.value = data || {}
  } catch (err) {
    error.value = extraerMensajeError(
      err,
      'No se pudo comprobar WhatsApp en este momento.'
    )
  } finally {
    loading.value = false
  }
}

const habilitarNotificaciones = async () => {
  const resultado = await activarNotificaciones()
  notificacionesHabilitadas.value = resultado.activas
  $q.notify({
    type: resultado.activas ? 'positive' : 'warning',
    message: resultado.mensaje
  })
}

onMounted(cargarEstado)
</script>

<style scoped>
.config-card {
  display: flex;
  min-height: 240px;
  flex-direction: column;
}
</style>
