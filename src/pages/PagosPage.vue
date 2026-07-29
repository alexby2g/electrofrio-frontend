<template>
  <q-page class="q-pa-md page-shell">
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Pagos</div>
        <div class="text-subtitle2 text-grey-7"
          >Registro de cobros con método, estado y monto sugerido desde la
          cita</div
        >
      </div>
      <div class="q-gutter-sm">
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo pago"
          @click="abrirCrear"
        />
        <q-btn
          color="primary"
          outline
          icon="refresh"
          label="Actualizar"
          @click="cargarPagos"
        />
      </div>
    </div>

    <q-card class="content-card q-mb-md">
      <q-card-section>
        <q-input
          v-model="buscar"
          outlined
          dense
          clearable
          debounce="400"
          label="Buscar pago por cliente, estado o método"
          @update:model-value="cargarPagos"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </q-card-section>
    </q-card>

    <q-banner v-if="error" class="bg-red-1 text-red q-mb-md rounded-borders">{{
      error
    }}</q-banner>

    <q-card class="content-card">
      <q-table
        title="Listado de pagos"
        :rows="pagos"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 20, 50, 0]"
        no-data-label="No hay pagos registrados"
      >
        <template #body-cell-monto="props">
          <q-td :props="props"
            ><span class="money-pill"
              >Bs {{ Number(props.row.monto || 0).toFixed(2) }}</span
            ></q-td
          >
        </template>

        <template #body-cell-metodo_pago="props">
          <q-td :props="props">
            <q-chip
              dense
              outline
              color="primary"
              :icon="iconoMetodo(props.row.metodo_pago)"
            >
              {{ textoMetodo(props.row.metodo_pago) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-estado="props">
          <q-td :props="props">
            <q-chip
              dense
              :color="colorEstado(props.row.estado)"
              text-color="white"
              >{{ textoEstado(props.row.estado) }}</q-chip
            >
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="table-actions">
            <ActionMenu
              @view="abrirVer(props.row)"
              @edit="abrirEditar(props.row)"
              @delete="eliminarPago(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog
      v-model="dialogo"
      persistent
      maximized
      transition-show="slide-left"
      transition-hide="slide-right"
    >
      <q-card class="workspace-dialog">
        <q-card-section class="bg-primary text-white">
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-h6">{{ tituloDialogo }}</div>
              <div class="text-caption text-blue-1"
                >Selecciona una cita para cargar cliente y monto
                automáticamente</div
              >
            </div>
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
        </q-card-section>

        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-7">
            <q-select
              v-model="form.cita_id"
              :options="citasOptions"
              emit-value
              map-options
              use-input
              input-debounce="0"
              label="Cita / atención"
              outlined
              clearable
              :readonly="modo === 'ver'"
              @filter="filtrarCitas"
              @update:model-value="seleccionarCita"
            />
          </div>
          <div class="col-12 col-md-5">
            <q-input
              :model-value="clientePagoNombre"
              label="Cliente"
              outlined
              readonly
              hint="Se carga desde la atención seleccionada"
            >
              <template #prepend><q-icon name="person" /></template>
            </q-input>
          </div>
          <div v-if="citaSeleccionada" class="col-12">
            <q-card flat bordered class="q-pa-sm selected-payment-card">
              <div class="row q-col-gutter-sm items-center">
                <div class="col-12 col-md-4"
                  ><strong>{{
                    citaSeleccionada.servicio?.nombre || 'Servicio técnico'
                  }}</strong
                  ><div class="text-caption"
                    >{{ formatearFecha(citaSeleccionada.fecha) }} ·
                    {{ String(citaSeleccionada.hora || '').slice(0, 5) }}</div
                  ></div
                >
                <div class="col-12 col-md-4"
                  ><strong>Cliente:</strong>
                  {{ citaSeleccionada.cliente?.nombre || 'Sin cliente'
                  }}<div class="text-caption">{{
                    citaSeleccionada.cliente?.telefono || 'Sin teléfono'
                  }}</div></div
                >
                <div class="col-12 col-md-4 text-md-right"
                  ><span class="money-pill"
                    >Sugerido: Bs
                    {{ Number(citaSeleccionada.total || 0).toFixed(2) }}</span
                  ></div
                >
              </div>
            </q-card>
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model.number="form.monto"
              type="number"
              label="Monto"
              prefix="Bs"
              outlined
              :readonly="modo === 'ver'"
              hint="Editable si es pago parcial"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="form.metodo_pago"
              :options="metodosOptions"
              emit-value
              map-options
              label="Método de pago"
              outlined
              :readonly="modo === 'ver'"
            >
              <template #selected-item="scope">
                <q-chip
                  dense
                  color="primary"
                  text-color="white"
                  :icon="scope.opt.icon"
                  >{{ scope.opt.label }}</q-chip
                >
              </template>
            </q-select>
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="form.estado"
              :options="estadosOptions"
              emit-value
              map-options
              label="Estado"
              outlined
              :readonly="modo === 'ver'"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="form.fecha_pago"
              type="date"
              label="Fecha"
              outlined
              :readonly="modo === 'ver'"
            />
          </div>
          <div class="col-12">
            <q-input
              v-model="form.observacion"
              label="Observación del pago"
              outlined
              type="textarea"
              rows="3"
              :readonly="modo === 'ver'"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" color="grey-8" v-close-popup />
          <q-btn
            v-if="modo !== 'ver'"
            color="primary"
            icon="save"
            :label="modo === 'crear' ? 'Guardar pago' : 'Actualizar pago'"
            @click="guardarPago"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { date, useQuasar } from 'quasar'
import ActionMenu from '../components/ActionMenu.vue'
import api, { extraerMensajeError } from '../services/api.js'

const $q = useQuasar()
const loading = ref(false)
const error = ref('')
const buscar = ref('')
const pagos = ref([])
const clientes = ref([])
const citas = ref([])
const citasFiltradas = ref([])
const dialogo = ref(false)
const modo = ref('crear')
const pagoId = ref(null)

const metodosOptions = [
  { label: 'Efectivo', value: 'efectivo', icon: 'payments' },
  { label: 'QR', value: 'qr', icon: 'qr_code_2' },
  { label: 'Transferencia', value: 'transferencia', icon: 'account_balance' },
  { label: 'Mixto', value: 'mixto', icon: 'splitscreen' }
]

const estadosOptions = [
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Pagado', value: 'pagado' },
  { label: 'Anulado', value: 'anulado' }
]

const formInicial = {
  cita_id: null,
  cliente_id: null,
  monto: 0,
  metodo_pago: 'efectivo',
  estado: 'pagado',
  fecha_pago: date.formatDate(new Date(), 'YYYY-MM-DD'),
  observacion: ''
}

const form = ref({ ...formInicial })

const clientesOptions = computed(() =>
  clientes.value.map(cliente => ({ label: cliente.nombre, value: cliente.id }))
)

const citasOptions = computed(() =>
  citasFiltradas.value.map(cita => ({
    label: etiquetaCita(cita),
    value: cita.id
  }))
)

const citaSeleccionada = computed(() =>
  citas.value.find(cita => Number(cita.id) === Number(form.value.cita_id))
)
const clientePagoNombre = computed(() => {
  const cliente =
    citaSeleccionada.value?.cliente ||
    clientes.value.find(
      item => Number(item.id) === Number(form.value.cliente_id)
    )
  return cliente?.nombre || 'Selecciona una atención'
})

const columns = [
  { name: 'acciones', label: '', field: 'acciones', align: 'center' },
  {
    name: 'fecha_pago',
    label: 'Fecha',
    field: row => formatearFecha(row.fecha_pago),
    align: 'left',
    sortable: true
  },
  {
    name: 'cliente',
    label: 'Cliente',
    field: row => row.cliente?.nombre || 'Sin cliente',
    align: 'left',
    sortable: true
  },
  {
    name: 'cita',
    label: 'Cita / servicio',
    field: row => row.cita?.servicio?.nombre || 'Pago directo',
    align: 'left'
  },
  {
    name: 'monto',
    label: 'Monto',
    field: 'monto',
    align: 'right',
    sortable: true
  },
  {
    name: 'metodo_pago',
    label: 'Método',
    field: 'metodo_pago',
    align: 'center'
  },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' }
]

const tituloDialogo = computed(() =>
  modo.value === 'crear'
    ? 'Registrar pago'
    : modo.value === 'editar'
      ? 'Editar pago'
      : 'Ver pago'
)
const textoMetodo = metodo =>
  metodosOptions.find(item => item.value === metodo)?.label || metodo
const iconoMetodo = metodo =>
  metodosOptions.find(item => item.value === metodo)?.icon || 'payments'
const textoEstado = estado =>
  estadosOptions.find(item => item.value === estado)?.label || estado
const colorEstado = estado =>
  ({ pendiente: 'warning', pagado: 'positive', anulado: 'negative' })[estado] ||
  'grey'
const formatearFecha = value =>
  value ? date.formatDate(value, 'DD/MM/YYYY') : '—'

const etiquetaCita = cita => {
  const cliente = cita.cliente?.nombre || 'Sin cliente'
  const servicio = cita.servicio?.nombre || 'Sin servicio'
  const total = Number(cita.total || 0).toFixed(2)
  return `${formatearFecha(cita.fecha)} ${String(cita.hora || '').slice(0, 5)} · ${cliente} · ${servicio} · Bs ${total}`
}

const limpiarFormulario = () => {
  form.value = { ...formInicial }
  pagoId.value = null
}

const cargarCombos = async () => {
  const [clientesResponse, citasResponse] = await Promise.all([
    api.get('/clientes'),
    api.get('/citas')
  ])
  clientes.value = clientesResponse.data.data || []
  citas.value = citasResponse.data.data || []
  citasFiltradas.value = citas.value
}

const cargarPagos = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/pagos', {
      params: { buscar: buscar.value || undefined }
    })
    pagos.value = response.data.data || []
  } catch (err) {
    error.value = extraerMensajeError(
      err,
      'No se pudo cargar la lista de pagos.'
    )
  } finally {
    loading.value = false
  }
}

const filtrarCitas = (val, update) => {
  update(() => {
    const texto = String(val || '').toLowerCase()
    citasFiltradas.value = citas.value.filter(cita =>
      etiquetaCita(cita).toLowerCase().includes(texto)
    )
  })
}

const seleccionarCita = value => {
  const cita = citas.value.find(item => Number(item.id) === Number(value))
  if (!cita) return
  form.value.cliente_id = cita.cliente_id || cita.cliente?.id || null
  form.value.monto = Number(cita.total || 0)
}

const abrirCrear = async () => {
  modo.value = 'crear'
  limpiarFormulario()
  await cargarCombos()
  dialogo.value = true
}

const abrirVer = async item => {
  modo.value = 'ver'
  pagoId.value = item.id
  await cargarCombos()
  form.value = {
    ...item,
    cita_id: item.cita_id || item.cita?.id || null,
    cliente_id: item.cliente_id || item.cliente?.id || null
  }
  dialogo.value = true
}

const abrirEditar = async item => {
  modo.value = 'editar'
  pagoId.value = item.id
  await cargarCombos()
  form.value = {
    ...item,
    cita_id: item.cita_id || item.cita?.id || null,
    cliente_id: item.cliente_id || item.cliente?.id || null
  }
  dialogo.value = true
}

const guardarPago = async () => {
  if (!form.value.monto || Number(form.value.monto) < 0) {
    $q.notify({ type: 'warning', message: 'El monto del pago es obligatorio' })
    return
  }

  try {
    if (modo.value === 'crear') await api.post('/pagos', form.value)
    else await api.put(`/pagos/${pagoId.value}`, form.value)

    $q.notify({ type: 'positive', message: 'Pago guardado correctamente' })
    dialogo.value = false
    limpiarFormulario()
    cargarPagos()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo guardar el pago')
    })
  }
}

const eliminarPago = item => {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: '¿Eliminar este pago?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/pagos/${item.id}`)
      $q.notify({ type: 'positive', message: 'Pago eliminado correctamente' })
      cargarPagos()
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: extraerMensajeError(err, 'No se pudo eliminar el pago')
      })
    }
  })
}

onMounted(() => {
  cargarPagos()
  cargarCombos()
})
</script>

<style scoped>
.selected-payment-card {
  background: linear-gradient(135deg, #ffffff 0%, #eef8ff 100%);
  border-color: rgba(25, 118, 210, 0.18);
}
</style>
