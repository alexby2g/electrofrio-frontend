<template>
  <q-page class="whatsapp-page q-pa-md q-pa-lg-lg">
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
      <div class="col min-width-0">
        <div class="row items-center q-gutter-sm q-mb-sm">
          <q-chip
            color="white"
            text-color="positive"
            icon="check_circle"
            label="Listo para usar"
          />
        </div>
        <div class="text-h4 text-weight-bold text-white">
          WhatsApp Business
        </div>
        <div class="text-subtitle1 text-white hero-copy">
          Prepara mensajes con la información de Electro Frío y ábrelos en la
          aplicación para confirmar el envío.
        </div>
      </div>
      <q-icon name="chat" size="70px" color="white" class="hero-icon" />
    </section>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-lg-7">
        <q-card flat bordered class="panel-card full-height">
          <q-card-section>
            <div class="text-overline text-positive">Modo simple y seguro</div>
            <div class="text-h5 text-weight-bold">Como funcionará</div>
            <div class="text-body2 text-grey-7 q-mt-xs">
              Electro Frío prepara el texto, conserva el seguimiento y abre
              WhatsApp Business. Tú revisas el mensaje y tocas Enviar.
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="steps-grid">
            <article v-for="paso in pasos" :key="paso.numero" class="step-card">
              <div class="step-number">{{ paso.numero }}</div>
              <q-icon :name="paso.icono" color="primary" size="34px" />
              <div class="text-subtitle1 text-weight-bold q-mt-sm">
                {{ paso.titulo }}
              </div>
              <div class="text-body2 text-grey-7">{{ paso.detalle }}</div>
            </article>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner rounded class="bg-green-1 text-green-10">
              <template #avatar>
                <q-icon name="verified_user" color="positive" />
              </template>
              No necesitas conectar Meta, compartir una contraseña ni guardar
              claves de WhatsApp en Electro Frío. El envío final siempre se
              confirma en tu aplicación.
            </q-banner>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-lg-5">
        <q-card flat bordered class="panel-card composer-card">
          <q-card-section>
            <div class="text-overline text-primary">Prueba rápida</div>
            <div class="text-h6 text-weight-bold">Preparar un mensaje</div>
            <div class="text-caption text-grey-7">
              Puedes verificar ahora mismo cómo se abrirá en WhatsApp Business.
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-gutter-md">
            <q-input
              v-model.trim="form.telefono"
              outlined
              label="Teléfono / WhatsApp"
              placeholder="73907925"
              inputmode="tel"
              clearable
            >
              <template #prepend><q-icon name="phone_iphone" /></template>
            </q-input>

            <q-input
              v-model.trim="form.nombre"
              outlined
              label="Nombre del cliente"
              placeholder="Ej.: Carolina"
              @update:model-value="actualizarPlantilla"
            >
              <template #prepend><q-icon name="person_outline" /></template>
            </q-input>

            <q-select
              v-model="form.plantilla"
              outlined
              emit-value
              map-options
              :options="opcionesPlantilla"
              label="Tipo de mensaje"
              @update:model-value="actualizarPlantilla"
            >
              <template #prepend><q-icon name="auto_awesome" /></template>
            </q-select>

            <q-input
              v-model="form.mensaje"
              outlined
              type="textarea"
              autogrow
              label="Vista previa del mensaje"
              :input-style="{ minHeight: '140px' }"
            />

            <q-btn
              unelevated
              no-caps
              color="positive"
              icon="open_in_new"
              label="Abrir en WhatsApp Business"
              class="full-width action-btn"
              @click="abrirPrueba"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-lg q-mt-xs">
      <div class="col-12 col-md-6">
        <q-card flat bordered class="shortcut-card">
          <q-card-section class="row items-center no-wrap q-gutter-md">
            <q-avatar color="blue-1" text-color="primary" icon="assignment" />
            <div class="col min-width-0">
              <div class="text-subtitle1 text-weight-bold">
                Mensajes desde una atención
              </div>
              <div class="text-body2 text-grey-7">
                Envía resumen, aviso de trabajo terminado, cobro o garantía con
                los datos ya registrados.
              </div>
            </div>
            <q-btn flat round color="primary" icon="arrow_forward" to="/citas" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card flat bordered class="shortcut-card">
          <q-card-section class="row items-center no-wrap q-gutter-md">
            <q-avatar color="green-1" text-color="positive" icon="forum" />
            <div class="col min-width-0">
              <div class="text-subtitle1 text-weight-bold">
                Conversaciones y seguimiento
              </div>
              <div class="text-body2 text-grey-7">
                Escribe desde Mensajes, guarda una copia en Electro Frío y abre
                WhatsApp Business para enviarla.
              </div>
            </div>
            <q-btn
              flat
              round
              color="positive"
              icon="arrow_forward"
              to="/mensajes"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { abrirWhatsAppBusiness } from '../services/whatsapp.js'

const $q = useQuasar()

const pasos = [
  {
    numero: '1',
    icono: 'person_search',
    titulo: 'Elige al cliente',
    detalle: 'El sistema utiliza el teléfono guardado en su ficha o atención.'
  },
  {
    numero: '2',
    icono: 'edit_note',
    titulo: 'Revisa el mensaje',
    detalle: 'Puedes usar una plantilla y modificar el texto antes de abrirlo.'
  },
  {
    numero: '3',
    icono: 'send',
    titulo: 'Confirma el envío',
    detalle: 'WhatsApp Business se abre con el destinatario y el texto listos.'
  }
]

const form = reactive({
  telefono: '',
  nombre: '',
  plantilla: 'bienvenida',
  mensaje: ''
})

const nombreCliente = computed(() => form.nombre || 'cliente')
const plantillas = computed(() => ({
  bienvenida: `Hola ${nombreCliente.value}, le saluda Electro Frío. ¿En qué podemos ayudarle con su equipo?`,
  confirmar: `Hola ${nombreCliente.value}, le escribimos de Electro Frío para confirmar su atención técnica. Por favor, indíquenos si mantiene disponible el horario acordado.`,
  camino: `Hola ${nombreCliente.value}, el técnico de Electro Frío ya se encuentra en camino hacia la dirección registrada.`,
  terminado: `Hola ${nombreCliente.value}, le informamos que el trabajo de su equipo ya está terminado. Podemos coordinar la entrega y el pago pendiente.`,
  seguimiento: `Hola ${nombreCliente.value}, le escribimos de Electro Frío para saber si el equipo continúa funcionando correctamente después del servicio.`
}))

const opcionesPlantilla = [
  { label: 'Primer contacto', value: 'bienvenida' },
  { label: 'Confirmar atención', value: 'confirmar' },
  { label: 'Técnico en camino', value: 'camino' },
  { label: 'Trabajo terminado', value: 'terminado' },
  { label: 'Seguimiento del servicio', value: 'seguimiento' }
]

const actualizarPlantilla = () => {
  form.mensaje = plantillas.value[form.plantilla] || ''
}

const abrirPrueba = () => {
  try {
    abrirWhatsAppBusiness(form.telefono, form.mensaje)
  } catch (error) {
    $q.notify({
      type: 'warning',
      message: error.message
    })
  }
}

actualizarPlantilla()
</script>

<style scoped>
.whatsapp-page {
  min-height: 100vh;
  background: #f2f7f9;
}

.min-width-0 {
  min-width: 0;
}

.whatsapp-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 30px;
  border-radius: 28px;
  background: linear-gradient(135deg, #0d47a1, #087f5b, #25d366);
  box-shadow: 0 16px 40px rgba(8, 127, 91, 0.24);
}

.hero-copy {
  max-width: 720px;
  opacity: 0.94;
}

.hero-icon {
  flex: 0 0 auto;
}

.panel-card,
.shortcut-card {
  border-radius: 24px;
  background: white;
  box-shadow: 0 12px 32px rgba(31, 67, 91, 0.08);
  overflow: hidden;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.step-card {
  position: relative;
  min-height: 190px;
  padding: 20px;
  border: 1px solid #dce7f4;
  border-radius: 20px;
  background: linear-gradient(145deg, #ffffff, #f7fbff);
}

.step-number {
  position: absolute;
  top: 14px;
  right: 16px;
  color: #0d47a1;
  font-size: 28px;
  font-weight: 900;
  opacity: 0.16;
}

.composer-card {
  height: 100%;
}

.action-btn {
  min-height: 52px;
  border-radius: 14px;
  font-weight: 800;
}

@media (max-width: 800px) {
  .whatsapp-page {
    padding: 14px !important;
  }

  .whatsapp-hero {
    align-items: flex-start;
    padding: 22px;
    border-radius: 22px;
  }

  .whatsapp-hero .text-h4 {
    font-size: 28px;
  }

  .hero-icon {
    display: none;
  }

  .steps-grid {
    grid-template-columns: 1fr;
  }

  .step-card {
    min-height: 0;
  }

  .shortcut-card .q-card__section {
    align-items: flex-start;
  }
}
</style>
