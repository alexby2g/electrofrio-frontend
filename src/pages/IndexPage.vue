<template>
  <q-page class="q-pa-md page-shell dashboard-pro-page">
    <q-card class="hero-card q-pa-lg q-mb-md">
      <div class="row items-center justify-between q-col-gutter-md">
        <div class="col-12 col-md-8">
          <div class="text-h4 text-weight-bold"
            >Panel de control Electro Frío</div
          >
          <div class="text-subtitle1 text-blue-1 q-mt-xs">
            Indicadores y accesos directos para administrar la operación diaria.
          </div>
        </div>
        <div class="col-12 col-md-auto q-gutter-sm">
          <q-btn
            unelevated
            color="white"
            text-color="primary"
            icon="event_available"
            label="Nueva atención"
            :to="{ name: 'citas', query: { nueva: '1' } }"
          />
          <q-btn
            unelevated
            color="white"
            text-color="primary"
            icon="refresh"
            label="Actualizar"
            @click="cargarDatos"
          />
        </div>
      </div>
    </q-card>

    <q-banner v-if="error" class="bg-red-1 text-red q-mb-md rounded-borders">
      {{ error }}
    </q-banner>

    <div class="row q-col-gutter-md">
      <div
        v-for="card in operacionCards"
        :key="card.label"
        class="col-12 col-sm-6 col-md-4 col-lg-2"
      >
        <q-card
          class="stat-card pro-stat-card dashboard-link-card q-pa-md"
          role="link"
          tabindex="0"
          @click="irA(card.to)"
          @keyup.enter="irA(card.to)"
        >
          <div class="row items-center no-wrap">
            <div class="stat-icon q-mr-md">
              <q-icon :name="card.icon" :color="card.color" size="30px" />
            </div>
            <div>
              <div class="text-grey-7 text-caption">{{ card.label }}</div>
              <div class="text-h5 text-weight-bold text-primary">{{
                card.value
              }}</div>
              <div v-if="card.caption" class="text-caption text-grey-7">{{
                card.caption
              }}</div>
            </div>
            <q-space />
            <q-icon name="arrow_forward" color="primary" size="20px" />
          </div>
          <q-tooltip>{{ card.action }}</q-tooltip>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-12 col-md-5">
        <q-card class="content-card full-height">
          <q-card-section>
            <div class="text-h6 text-weight-bold">Flujo de atenciones</div>
            <div class="text-caption text-grey-7"
              >Etapas reales del servicio técnico</div
            >
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div
              v-for="estado in estados"
              :key="estado.key"
              class="q-mb-md dashboard-flow-link"
              role="link"
              tabindex="0"
              @click="irA({ name: 'citas', query: { etapa: estado.key } })"
              @keyup.enter="
                irA({ name: 'citas', query: { etapa: estado.key } })
              "
            >
              <div class="row justify-between q-mb-xs">
                <span class="text-weight-medium">{{ estado.label }}</span>
                <strong>{{ estado.value }}</strong>
              </div>
              <q-linear-progress
                rounded
                size="12px"
                :value="estado.percent"
                :color="estado.color"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-7">
        <q-card class="content-card full-height">
          <q-card-section>
            <div class="text-h6 text-weight-bold">Últimas atenciones</div>
            <div class="text-caption text-grey-7"
              >Trabajos técnicos registrados recientemente</div
            >
          </q-card-section>
          <q-separator />
          <q-table
            flat
            :rows="dashboard.ultimas_citas || []"
            :columns="columnasCitas"
            row-key="id"
            :loading="loading"
            :pagination="{ rowsPerPage: 6 }"
            no-data-label="No hay atenciones registradas"
            class="dashboard-table"
            @row-click="(_, row) => abrirAtencion(row)"
          >
            <template #body-cell-etapa="props">
              <q-td :props="props">
                <q-chip
                  dense
                  :color="colorEtapa(props.row.etapa)"
                  text-color="white"
                >
                  {{ textoEtapa(props.row.etapa) }}
                </q-chip>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-12 col-md-6">
        <q-card class="content-card full-height">
          <q-card-section>
            <div class="text-h6 text-weight-bold">Garantías por vencer</div>
            <div class="text-caption text-grey-7"
              >Servicios con garantía vigente cerca de vencer</div
            >
          </q-card-section>
          <q-separator />
          <q-list v-if="garantiasPorVencer.length" separator>
            <q-item
              v-for="garantia in garantiasPorVencer"
              :key="garantia.detalle_id"
              clickable
              v-ripple
              @click="abrirAtencion({ id: garantia.cita_id })"
            >
              <q-item-section avatar>
                <q-icon name="verified" color="warning" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{
                  garantia.cliente || 'Cliente sin nombre'
                }}</q-item-label>
                <q-item-label caption
                  >{{ garantia.equipo || 'Equipo no registrado' }} ·
                  {{ garantia.servicio || 'Servicio técnico' }}</q-item-label
                >
                <q-item-label caption
                  >Vence: {{ formatearFecha(garantia.vence) }} ·
                  {{ garantia.dias_restantes }} días restantes</q-item-label
                >
              </q-item-section>
            </q-item>
          </q-list>
          <q-card-section v-else class="text-grey-7">
            No hay garantías por vencer en los próximos días.
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card class="content-card full-height">
          <q-card-section>
            <div class="text-h6 text-weight-bold">Servicios más realizados</div>
            <div class="text-caption text-grey-7"
              >Ayuda a ver qué trabajo mueve más el negocio</div
            >
          </q-card-section>
          <q-separator />
          <q-list v-if="serviciosTop.length" separator>
            <q-item
              v-for="item in serviciosTop"
              :key="item.servicio_id"
              clickable
              v-ripple
              @click="irA('/servicios')"
            >
              <q-item-section avatar
                ><q-icon name="build_circle" color="primary"
              /></q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{
                  item.servicio?.nombre || 'Servicio sin nombre'
                }}</q-item-label>
                <q-item-label caption
                  >{{ item.total }} atenciones · Bs
                  {{ Number(item.ingresos || 0).toFixed(2) }}</q-item-label
                >
              </q-item-section>
            </q-item>
          </q-list>
          <q-card-section v-else class="text-grey-7">
            Todavía no hay suficiente movimiento para calcular el ranking.
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { date } from 'quasar'
import { useRouter } from 'vue-router'
import api, { extraerMensajeError } from '../services/api.js'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const dashboard = ref({
  totales: {},
  operacion_diaria: {},
  estado_citas: {},
  etapa_citas: {},
  ultimas_citas: [],
  servicios_top: [],
  garantias_por_vencer_lista: []
})

const columnasCitas = [
  {
    name: 'fecha',
    label: 'Fecha',
    field: row => formatearFecha(row.fecha),
    align: 'left',
    sortable: true
  },
  {
    name: 'cliente',
    label: 'Cliente',
    field: row => row.cliente?.nombre || 'Sin cliente',
    align: 'left'
  },
  {
    name: 'servicio',
    label: 'Servicio',
    field: row => row.servicio?.nombre || 'Sin servicio',
    align: 'left'
  },
  { name: 'etapa', label: 'Etapa', field: 'etapa', align: 'center' }
]

const operacionCards = computed(() => {
  const op = dashboard.value.operacion_diaria || {}
  return [
    {
      label: 'Atenciones hoy',
      icon: 'today',
      color: 'primary',
      value: op.atenciones_hoy ?? 0,
      to: { name: 'citas', query: { vista: 'hoy' } },
      action: 'Ver las atenciones de hoy'
    },
    {
      label: 'Trabajos abiertos',
      icon: 'pending_actions',
      color: 'warning',
      value: op.trabajos_abiertos ?? 0,
      to: { name: 'citas', query: { vista: 'abiertos' } },
      action: 'Ver los trabajos que siguen abiertos'
    },
    {
      label: 'Pendiente cobro',
      icon: 'request_quote',
      color: 'negative',
      value: `Bs ${Number(op.pendiente_cobro || 0).toFixed(2)}`,
      to: { name: 'citas', query: { vista: 'cobros_pendientes' } },
      action: 'Ver atenciones con saldo pendiente'
    },
    {
      label: 'Ingresos hoy',
      icon: 'payments',
      color: 'positive',
      value: `Bs ${Number(op.ingresos_hoy || 0).toFixed(2)}`,
      to: { name: 'citas', query: { vista: 'pagos_hoy' } },
      action: 'Ver los cobros registrados hoy'
    },
    {
      label: 'Ingresos mes',
      icon: 'calendar_month',
      color: 'positive',
      value: `Bs ${Number(op.ingresos_mes || 0).toFixed(2)}`,
      to: { name: 'citas', query: { vista: 'pagos_mes' } },
      action: 'Ver los cobros registrados este mes'
    },
    {
      label: 'Garantías',
      icon: 'verified',
      color: 'info',
      value: op.garantias_vigentes ?? 0,
      caption: `${op.garantias_por_vencer ?? 0} por vencer`,
      to: { name: 'citas', query: { vista: 'garantias' } },
      action: 'Ver atenciones con garantía vigente'
    }
  ]
})

const estados = computed(() => {
  const data = dashboard.value.etapa_citas || {}
  const total =
    Object.values(data).reduce((sum, value) => sum + Number(value || 0), 0) || 1
  return estadoFlujo.map(item => ({
    ...item,
    value: data[item.key] || 0,
    percent: Number(data[item.key] || 0) / total
  }))
})

const garantiasPorVencer = computed(
  () => dashboard.value.garantias_por_vencer_lista || []
)
const serviciosTop = computed(() => dashboard.value.servicios_top || [])

const estadoFlujo = [
  { key: 'cita', label: '1. Cita agendada', color: 'primary' },
  { key: 'diagnostico', label: '2. Diagnóstico', color: 'orange' },
  { key: 'propuesta', label: '3. Propuesta y decisión', color: 'deep-orange' },
  { key: 'servicio', label: '4. Servicio aceptado', color: 'info' },
  { key: 'pago', label: '5. Pago', color: 'teal' },
  { key: 'garantia', label: '6. Garantía', color: 'positive' },
  { key: 'cerrada', label: 'Cerrada sin servicio', color: 'negative' }
]

const textoEtapa = etapa =>
  ({
    cita: 'Cita',
    diagnostico: 'Diagnóstico',
    propuesta: 'Propuesta',
    servicio: 'Servicio',
    pago: 'Pago',
    garantia: 'Garantía',
    cerrada: 'Cerrada'
  })[etapa] ||
  etapa ||
  'Cita'

const colorEtapa = etapa =>
  ({
    cita: 'primary',
    diagnostico: 'orange',
    propuesta: 'deep-orange',
    servicio: 'info',
    pago: 'teal',
    garantia: 'positive',
    cerrada: 'negative'
  })[etapa] || 'grey'

const formatearFecha = value =>
  value ? date.formatDate(value, 'DD/MM/YYYY') : '—'

const irA = destino => {
  if (destino) router.push(destino)
}

const abrirAtencion = item => {
  if (!item?.id) return
  irA({ name: 'citas', query: { abrir: String(item.id) } })
}

const cargarDatos = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/dashboard')
    dashboard.value = response.data
  } catch (err) {
    error.value = extraerMensajeError(
      err,
      'No se pudo conectar con el backend. Verifica que Laravel esté encendido.'
    )
  } finally {
    loading.value = false
  }
}

onMounted(cargarDatos)
</script>

<style scoped>
.dashboard-pro-page .pro-stat-card {
  min-height: 104px;
}
.full-height {
  height: 100%;
}
.dashboard-link-card,
.dashboard-flow-link {
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}
.dashboard-link-card:hover,
.dashboard-link-card:focus-visible {
  transform: translateY(-3px);
  box-shadow: 0 18px 38px rgba(16, 42, 67, 0.16);
  outline: 2px solid rgba(18, 184, 200, 0.55);
  outline-offset: 2px;
}
.dashboard-flow-link:hover,
.dashboard-flow-link:focus-visible {
  transform: translateX(4px);
  outline: none;
}
.dashboard-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
