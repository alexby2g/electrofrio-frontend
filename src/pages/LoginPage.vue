<template>
  <main class="login-page flex flex-center q-pa-md">
    <div class="login-shell row no-wrap">
      <section class="login-brand column justify-between q-pa-xl gt-sm">
        <div>
          <q-avatar size="86px" class="login-logo q-mb-lg">
            <img :src="logoElectroFrio" alt="Electro Frío" />
          </q-avatar>
          <div class="text-h3 text-weight-bold">Electro Frío</div>
          <div class="text-h6 text-blue-1 q-mt-sm">
            Sistema profesional de gestión técnica
          </div>
        </div>

        <div class="text-body1 text-blue-1">
          Clientes, equipos, atenciones, mensajes y pagos en un solo lugar.
        </div>
      </section>

      <q-card flat class="login-card q-pa-lg q-pa-md-xl">
        <q-card-section class="q-pb-sm">
          <div class="row items-center q-mb-md lt-md">
            <q-avatar size="58px" class="login-logo q-mr-md">
              <img :src="logoElectroFrio" alt="Electro Frío" />
            </q-avatar>
            <div>
              <div class="text-h5 text-weight-bold text-primary">
                Electro Frío
              </div>
              <div class="text-caption text-grey-7">
                Sistema de gestión técnica
              </div>
            </div>
          </div>

          <div class="text-h4 text-weight-bold text-blue-grey-10">
            Iniciar sesión
          </div>
          <div class="text-body1 text-grey-7 q-mt-sm">
            Ingresa con tu correo, nombre de usuario, teléfono o un código de
            verificación.
          </div>
        </q-card-section>

        <q-card-section>
          <q-tabs
            v-model="metodo"
            dense
            no-caps
            class="login-tabs text-grey-7"
            active-color="primary"
            indicator-color="primary"
          >
            <q-tab name="password" icon="lock_outline" label="Contraseña" />
            <q-tab name="otp" icon="sms" label="Código al teléfono" />
          </q-tabs>
        </q-card-section>

        <q-form class="q-gutter-md" @submit.prevent="continuar">
          <q-card-section class="q-pt-sm">
            <q-banner
              v-if="mensajeError"
              rounded
              class="bg-red-1 text-negative q-mb-lg"
            >
              <template #avatar>
                <q-icon name="error_outline" color="negative" />
              </template>
              {{ mensajeError }}
            </q-banner>

            <template v-if="metodo === 'password'">
              <q-input
                v-model.trim="form.identificador"
                outlined
                label="Correo, usuario o teléfono"
                autocomplete="username"
                :disable="cargando"
                :rules="[
                  valor =>
                    Boolean(valor) ||
                    'El correo, usuario o teléfono es obligatorio'
                ]"
              >
                <template #prepend>
                  <q-icon name="contact_phone" />
                </template>
              </q-input>

              <q-input
                v-model="form.password"
                outlined
                :type="mostrarPassword ? 'text' : 'password'"
                label="Contraseña"
                autocomplete="current-password"
                :disable="cargando"
                :rules="[
                  valor => Boolean(valor) || 'La contraseña es obligatoria'
                ]"
              >
                <template #prepend>
                  <q-icon name="lock_outline" />
                </template>
                <template #append>
                  <q-icon
                    :name="mostrarPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="mostrarPassword = !mostrarPassword"
                  />
                </template>
              </q-input>
            </template>

            <template v-else>
              <q-input
                v-model.trim="otpForm.telefono"
                outlined
                label="Número de teléfono"
                hint="Ejemplo: +59170000000"
                :disable="cargando || codigoEnviado"
                :rules="[
                  valor => Boolean(valor) || 'El teléfono es obligatorio'
                ]"
              >
                <template #prepend>
                  <q-icon name="phone_android" />
                </template>
              </q-input>

              <div v-if="!codigoEnviado" class="q-mb-md">
                <div class="text-caption text-grey-7 q-mb-sm">
                  ¿Dónde quieres recibir el código?
                </div>
                <q-option-group
                  v-model="otpForm.canal"
                  inline
                  color="primary"
                  :options="canalesOtp"
                />
              </div>

              <q-input
                v-else
                v-model.trim="otpForm.codigo"
                outlined
                input-class="text-center text-h6"
                label="Código de verificación"
                maxlength="10"
                :disable="cargando"
                :rules="[valor => Boolean(valor) || 'Ingresa el código']"
              >
                <template #prepend>
                  <q-icon name="pin" />
                </template>
              </q-input>

              <q-banner
                v-if="codigoPrueba"
                rounded
                class="bg-amber-1 text-amber-10 q-mb-md"
              >
                Modo local: tu código de prueba es
                <strong>{{ codigoPrueba }}</strong>
              </q-banner>
            </template>

            <q-btn
              unelevated
              no-caps
              size="lg"
              color="primary"
              :icon="botonIcono"
              :label="botonTexto"
              type="submit"
              class="full-width q-mt-sm"
              :loading="cargando"
            />

            <q-btn
              v-if="metodo === 'otp' && codigoEnviado"
              flat
              no-caps
              color="primary"
              label="Usar otro número"
              class="full-width q-mt-sm"
              @click="reiniciarOtp"
            />

            <div class="text-center text-caption text-grey-6 q-mt-lg">
              Acceso exclusivo para personal autorizado de Electro Frío.
            </div>
          </q-card-section>
        </q-form>
      </q-card>
    </div>
  </main>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { extraerMensajeError } from '../services/api.js'
import { guardarSesion } from '../services/auth.js'
import {
  activarNotificaciones,
  notificarEvento,
  notificacionesActivas
} from '../services/native.js'
import logoElectroFrio from '../assets/electrofrio-mark.png'

const route = useRoute()
const router = useRouter()
const metodo = ref('password')
const cargando = ref(false)
const mensajeError = ref('')
const mostrarPassword = ref(false)
const codigoEnviado = ref(false)
const codigoPrueba = ref('')

const form = reactive({
  identificador: '',
  password: ''
})

const otpForm = reactive({
  telefono: '',
  canal: 'sms',
  codigo: ''
})

const canalesOtp = [
  { label: 'Mensaje SMS', value: 'sms' },
  { label: 'WhatsApp', value: 'whatsapp' }
]

const botonTexto = computed(() => {
  if (metodo.value === 'password') return 'Ingresar al sistema'
  return codigoEnviado.value ? 'Verificar e ingresar' : 'Enviar código'
})

const botonIcono = computed(() => {
  if (metodo.value === 'password') return 'login'
  return codigoEnviado.value ? 'verified_user' : 'send_to_mobile'
})

watch(metodo, () => {
  mensajeError.value = ''
})

const continuar = async () => {
  if (metodo.value === 'password') {
    await iniciarSesion()
  } else if (codigoEnviado.value) {
    await verificarOtp()
  } else {
    await solicitarOtp()
  }
}

const iniciarSesion = async () => {
  cargando.value = true
  mensajeError.value = ''

  try {
    const response = await api.post('/auth/login', {
      identificador: form.identificador,
      password: form.password,
      dispositivo: 'electrofrio-web'
    })
    await completarIngreso(response.data)
  } catch (error) {
    mensajeError.value = extraerMensajeError(
      error,
      'No se pudo iniciar sesión. Verifica tus datos.'
    )
  } finally {
    cargando.value = false
  }
}

const solicitarOtp = async () => {
  cargando.value = true
  mensajeError.value = ''
  codigoPrueba.value = ''

  try {
    const { data } = await api.post('/auth/otp/solicitar', {
      telefono: otpForm.telefono,
      canal: otpForm.canal
    })
    codigoEnviado.value = true
    codigoPrueba.value = data.codigo_prueba || ''
  } catch (error) {
    mensajeError.value = extraerMensajeError(
      error,
      'No se pudo enviar el código.'
    )
  } finally {
    cargando.value = false
  }
}

const verificarOtp = async () => {
  cargando.value = true
  mensajeError.value = ''

  try {
    const response = await api.post('/auth/otp/verificar', {
      telefono: otpForm.telefono,
      codigo: otpForm.codigo,
      dispositivo: 'electrofrio-web-otp'
    })
    await completarIngreso(response.data)
  } catch (error) {
    mensajeError.value = extraerMensajeError(error, 'El código no es válido.')
  } finally {
    cargando.value = false
  }
}

const completarIngreso = async data => {
  guardarSesion(data)
  if (!notificacionesActivas()) {
    await activarNotificaciones().catch(() => null)
  }
  await notificarEvento({
    titulo: 'Sesión iniciada',
    mensaje: `Bienvenido a Electro Frío${data.usuario?.name ? `, ${data.usuario.name}` : ''}.`,
    extra: { tipo: 'inicio_sesion' }
  }).catch(() => null)
  const destino =
    typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  await router.replace(destino)
}

const reiniciarOtp = () => {
  codigoEnviado.value = false
  codigoPrueba.value = ''
  otpForm.codigo = ''
  mensajeError.value = ''
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at 15% 20%,
      rgba(18, 184, 200, 0.24),
      transparent 34%
    ),
    linear-gradient(135deg, #edf8fa 0%, #f4f8fa 48%, #e2eef2 100%);
}

.login-shell {
  width: min(1060px, 100%);
  min-height: 640px;
  overflow: hidden;
  border: 1px solid #d9e8ed;
  border-radius: 28px;
  background: white;
  box-shadow: 0 28px 80px rgba(16, 42, 67, 0.2);
}

.login-brand {
  width: 48%;
  color: white;
  background:
    radial-gradient(
      circle at 12% 12%,
      rgba(102, 224, 242, 0.2),
      transparent 35%
    ),
    linear-gradient(145deg, #071827 0%, #102a43 55%, #0b7f92 100%);
}

.login-card {
  width: 52%;
  align-self: center;
}

.login-logo {
  padding: 4px;
  border: 1px solid rgba(102, 224, 242, 0.35);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 34px rgba(7, 24, 39, 0.22);
}

.login-tabs,
.login-help {
  border: 1px solid #bce8ed;
  border-radius: 12px;
  background: #edfafa;
}

@media (max-width: 1023px) {
  .login-shell {
    width: min(560px, 100%);
    min-height: auto;
  }

  .login-card {
    width: 100%;
  }
}
</style>
