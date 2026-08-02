<template>
  <q-page class="q-pa-md whatsapp-page">
    <q-btn
      flat
      no-caps
      color="primary"
      icon="arrow_back"
      label="Volver a configuración"
      to="/configuracion"
      class="q-mb-md"
    />

    <section class="whatsapp-hero q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-white">WhatsApp Business</div>
        <div class="text-subtitle1 text-white opacity-90">
          Conecta la cuenta oficial de Electro Frío con el sistema.
        </div>
      </div>

      <q-icon name="chat" size="64px" color="white" />
    </section>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-lg-7">
        <q-card class="panel-card">
          <q-card-section
            class="row items-center justify-between q-col-gutter-md"
          >
            <div class="col">
              <div class="text-h6 text-weight-bold">Estado de la conexión</div>
              <div class="text-body2 text-grey-7">
                Usa el flujo seguro de Meta para autorizar la cuenta de WhatsApp
                Business.
              </div>
            </div>

            <div class="col-auto">
              <q-chip
                :color="statusColor"
                text-color="white"
                :icon="statusIcon"
                :label="statusLabel"
              />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-banner
              v-if="lastError"
              rounded
              class="bg-red-1 text-red-9 q-mb-md"
            >
              <template #avatar>
                <q-icon name="error" color="negative" />
              </template>
              {{ lastError }}
            </q-banner>

            <q-banner
              v-if="status === 'authorized'"
              rounded
              class="bg-orange-1 text-orange-10 q-mb-md"
            >
              <template #avatar>
                <q-icon name="warning" color="orange" />
              </template>
              Meta autorizó la cuenta, pero falta guardar la conexión en el
              backend.
            </q-banner>

            <div class="connection-box q-mb-lg">
              <q-avatar
                size="74px"
                color="green-1"
                text-color="green-8"
                icon="phone_in_talk"
              />

              <div class="connection-copy">
                <div class="text-h6 text-weight-bold">Electro Frío</div>
                <div class="text-body2 text-grey-7">
                  Configuración de coexistencia con la aplicación WhatsApp
                  Business.
                </div>
              </div>
            </div>

            <q-btn
              unelevated
              no-caps
              size="lg"
              icon="link"
              :label="connectButtonLabel"
              class="connect-btn full-width"
              :loading="connecting"
              :disable="!sdkReady || connecting || status === 'connected'"
              @click="connectWhatsApp"
            />

            <div
              v-if="!sdkReady"
              class="text-caption text-grey-7 text-center q-mt-sm"
            >
              Preparando conexión segura con Meta...
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-5">
        <q-card class="panel-card details-card">
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md"
              >Datos de la integración</div
            >

            <q-list separator>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="verified_user" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Aplicación de Meta</q-item-label>
                  <q-item-label caption>Electro Frío</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="settings" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Configuración</q-item-label>
                  <q-item-label caption>Electro Frío Coexistencia</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="wabaId">
                <q-item-section avatar>
                  <q-icon name="business" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Cuenta de WhatsApp Business</q-item-label>
                  <q-item-label caption>{{ wabaId }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="phoneNumberId">
                <q-item-section avatar>
                  <q-icon name="smartphone" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Número autorizado</q-item-label>
                  <q-item-label caption>{{ phoneNumberId }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import api, { extraerMensajeError } from '../services/api.js'

const META_APP_ID = import.meta.env.QCLI_META_APP_ID || '1681991026216392'
const META_CONFIG_ID = import.meta.env.QCLI_META_CONFIG_ID || '1026971116821532'
const META_GRAPH_VERSION = import.meta.env.QCLI_META_GRAPH_VERSION || 'v26.0'
const CONNECT_PATH =
  import.meta.env.QCLI_WHATSAPP_CONNECT_PATH ||
  '/integraciones/whatsapp/conectar'
const STATUS_PATH =
  import.meta.env.QCLI_WHATSAPP_STATUS_PATH || '/integraciones/whatsapp/estado'
const FACEBOOK_SDK_URL = 'https://connect.facebook.net/es_LA/sdk.js'
const ALLOWED_META_ORIGINS = new Set([
  'https://www.facebook.com',
  'https://web.facebook.com',
  'https://business.facebook.com'
])

let facebookSdkPromise = null

function loadFacebookSdk() {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('El SDK de Meta solo puede cargarse en el navegador.')
    )
  }

  if (window.FB) return Promise.resolve(window.FB)
  if (facebookSdkPromise) return facebookSdkPromise

  facebookSdkPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('fb-root')) {
      const root = document.createElement('div')
      root.id = 'fb-root'
      document.body.prepend(root)
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        xfbml: false,
        version: META_GRAPH_VERSION
      })

      resolve(window.FB)
    }

    const existingScript = document.getElementById('facebook-jssdk')
    if (existingScript) {
      existingScript.addEventListener(
        'error',
        () => reject(new Error('No se pudo cargar Meta SDK.')),
        {
          once: true
        }
      )
      return
    }

    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.src = FACEBOOK_SDK_URL
    script.async = true
    script.defer = true
    script.onerror = () => {
      facebookSdkPromise = null
      reject(new Error('No se pudo cargar Meta SDK.'))
    }

    document.head.appendChild(script)
  })

  return facebookSdkPromise
}

export default {
  name: 'WhatsAppPage',

  data() {
    return {
      sdkReady: false,
      connecting: false,
      savingConnection: false,
      status: 'disconnected',
      authorizationCode: null,
      lastError: '',
      wabaId: null,
      phoneNumberId: null,
      businessId: null
    }
  },

  computed: {
    statusLabel() {
      const labels = {
        disconnected: 'No conectado',
        authorizing: 'Autorizando',
        authorized: 'Autorizado en Meta',
        connected: 'Conectado',
        error: 'Error'
      }

      return labels[this.status] || 'No conectado'
    },

    statusColor() {
      const colors = {
        disconnected: 'grey-7',
        authorizing: 'blue-7',
        authorized: 'orange-8',
        connected: 'green-7',
        error: 'red-7'
      }

      return colors[this.status] || 'grey-7'
    },

    statusIcon() {
      const icons = {
        disconnected: 'link_off',
        authorizing: 'sync',
        authorized: 'hourglass_top',
        connected: 'check_circle',
        error: 'error'
      }

      return icons[this.status] || 'link_off'
    },

    connectButtonLabel() {
      if (this.status === 'connected') return 'WhatsApp Business conectado'
      if (this.status === 'authorized') return 'Volver a guardar la conexión'
      return 'Conectar WhatsApp Business'
    }
  },

  async mounted() {
    window.addEventListener('message', this.handleEmbeddedSignupMessage)

    try {
      await loadFacebookSdk()
      this.sdkReady = true
    } catch (error) {
      this.status = 'error'
      this.lastError = error.message
    }

    await this.loadConnectionStatus()
  },

  beforeUnmount() {
    window.removeEventListener('message', this.handleEmbeddedSignupMessage)
    this.authorizationCode = null
  },

  methods: {
    async loadConnectionStatus() {
      try {
        const response = await api.get(STATUS_PATH)
        const data = response.data?.data || response.data || {}

        if (
          data.connected === true ||
          data.conectado === true ||
          data.status === 'connected'
        ) {
          this.status = 'connected'
          this.wabaId = data.waba_id || data.wabaId || null
          this.phoneNumberId =
            data.phone_number_id || data.phoneNumberId || null
          this.businessId = data.business_id || data.businessId || null
        }
      } catch (error) {
        this.lastError = extraerMensajeError(
          error,
          'No se pudo comprobar el estado de WhatsApp.'
        )
      }
    },

    handleEmbeddedSignupMessage(event) {
      if (!ALLOWED_META_ORIGINS.has(event.origin)) return

      let payload = event.data

      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload)
        } catch {
          return
        }
      }

      if (!payload || payload.type !== 'WA_EMBEDDED_SIGNUP') return

      if (payload.event === 'FINISH') {
        const data = payload.data || {}

        this.wabaId = data.waba_id || data.wabaId || null
        this.phoneNumberId = data.phone_number_id || data.phoneNumberId || null
        this.businessId = data.business_id || data.businessId || null

        if (this.status !== 'connected') this.status = 'authorized'
        this.saveConnection()
        return
      }

      if (payload.event === 'CANCEL') {
        this.connecting = false
        this.status = 'disconnected'
        this.authorizationCode = null
        this.$q.notify({
          type: 'warning',
          message: 'La conexión con WhatsApp Business fue cancelada.'
        })
        return
      }

      if (payload.event === 'ERROR') {
        const data = payload.data || {}
        this.connecting = false
        this.status = 'error'
        this.lastError =
          data.error_message ||
          data.message ||
          'Meta informó un error durante la conexión.'
      }
    },

    async connectWhatsApp() {
      this.connecting = true
      this.status = 'authorizing'
      this.lastError = ''
      this.authorizationCode = null
      this.wabaId = null
      this.phoneNumberId = null
      this.businessId = null

      try {
        const FB = await loadFacebookSdk()

        FB.login(
          response => {
            const code = response?.authResponse?.code

            if (!code) {
              if (this.status === 'authorizing') this.status = 'disconnected'
              this.connecting = false
              this.$q.notify({
                type: 'warning',
                message:
                  'Meta no devolvió la autorización. Revisa si cerraste la ventana o cancelaste el proceso.'
              })
              return
            }

            this.authorizationCode = code
            if (this.status !== 'connected') this.status = 'authorized'
            this.saveConnection()
          },
          {
            config_id: META_CONFIG_ID,
            response_type: 'code',
            override_default_response_type: true,
            extras: {
              featureType: 'whatsapp_business_app_onboarding',
              setup: {},
              sessionInfoVersion: '3'
            }
          }
        )
      } catch (error) {
        this.connecting = false
        this.status = 'error'
        this.lastError =
          error.message || 'No se pudo iniciar la conexión con Meta.'
      }
    },

    async saveConnection() {
      if (!this.authorizationCode || this.savingConnection) return

      this.savingConnection = true

      try {
        const response = await api.post(CONNECT_PATH, {
          code: this.authorizationCode,
          config_id: META_CONFIG_ID,
          waba_id: this.wabaId,
          phone_number_id: this.phoneNumberId,
          business_id: this.businessId
        })

        const data = response.data?.data || response.data || {}
        this.status = 'connected'
        this.lastError = ''
        this.wabaId = data.waba_id || data.wabaId || this.wabaId
        this.phoneNumberId =
          data.phone_number_id || data.phoneNumberId || this.phoneNumberId
        this.businessId = data.business_id || data.businessId || this.businessId

        this.$q.notify({
          type: 'positive',
          message: 'WhatsApp Business quedó conectado con Electro Frío.'
        })
      } catch (error) {
        this.status = 'authorized'
        this.lastError = extraerMensajeError(
          error,
          'Meta autorizó la cuenta, pero el backend todavía no pudo guardar la conexión.'
        )

        this.$q.notify({
          type: 'warning',
          message:
            'La autorización llegó correctamente. Falta completar la conexión en el backend.'
        })
      } finally {
        this.authorizationCode = null
        this.connecting = false
        this.savingConnection = false
      }
    }
  }
}
</script>

<style scoped>
.whatsapp-page {
  min-height: 100vh;
}

.whatsapp-hero {
  background: linear-gradient(135deg, #0d47a1, #087f5b, #25d366);
  border-radius: 28px;
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 16px 40px rgba(8, 127, 91, 0.24);
}

.opacity-90 {
  opacity: 0.9;
}

.panel-card {
  border-radius: 24px;
  box-shadow: 0 14px 35px rgba(13, 71, 161, 0.12);
  overflow: hidden;
}

.details-card {
  height: 100%;
}

.connection-box {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px;
  border: 1px solid #dce7f4;
  border-radius: 20px;
  background: linear-gradient(135deg, #f8fbff, #effaf4);
}

.connection-copy {
  min-width: 0;
}

.connect-btn {
  min-height: 56px;
  border-radius: 16px;
  color: white;
  background: linear-gradient(135deg, #087f5b, #25d366);
  font-weight: 800;
}

@media (max-width: 600px) {
  .whatsapp-hero {
    padding: 22px;
    border-radius: 22px;
  }

  .whatsapp-hero .text-h4 {
    font-size: 26px;
  }

  .connection-box {
    align-items: flex-start;
    padding: 18px;
  }
}
</style>
