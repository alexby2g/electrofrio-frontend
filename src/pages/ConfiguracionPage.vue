<template>
  <q-page class="q-pa-md page-shell">
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Configuración</div>
        <div class="text-subtitle2 text-grey-7">
          Catálogos, personal, accesos e integraciones en un solo lugar
        </div>
      </div>
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
                  Prepara mensajes y ábrelos en la aplicación para confirmar el
                  envío.
                </div>
              </div>
            </div>
          </q-card-section>
          <q-card-section>
            <q-chip color="positive" text-color="white" icon="check_circle">
              Listo para usar
            </q-chip>
            <div class="text-caption text-grey-7 q-mt-sm">
              Funciona con WhatsApp y WhatsApp Business, sin conectar Meta ni
              guardar claves privadas.
            </div>
          </q-card-section>
          <q-space />
          <q-card-actions align="right" class="q-pa-md q-gutter-sm">
            <q-btn
              v-if="esAdministrador"
              color="positive"
              icon="tune"
              label="Ver funcionamiento"
              to="/whatsapp"
            />
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

  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { obtenerUsuario } from '../services/auth.js'
import {
  activarNotificaciones,
  esAplicacionNativa,
  notificacionesActivas
} from '../services/native.js'
import { useQuasar } from 'quasar'

const $q = useQuasar()
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

const habilitarNotificaciones = async () => {
  const resultado = await activarNotificaciones()
  notificacionesHabilitadas.value = resultado.activas
  $q.notify({
    type: resultado.activas ? 'positive' : 'warning',
    message: resultado.mensaje
  })
}
</script>

<style scoped>
.config-card {
  display: flex;
  min-height: 240px;
  flex-direction: column;
}
</style>
