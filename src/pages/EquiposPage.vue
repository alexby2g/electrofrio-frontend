<template>
  <q-page class="q-pa-md page-shell">
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Equipos</div>
        <div class="text-subtitle2 text-grey-7"
          >Equipos reales por cliente con historial técnico independiente</div
        >
      </div>
      <div class="q-gutter-sm">
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo equipo"
          @click="abrirCrear"
        />
        <q-btn
          color="primary"
          outline
          icon="refresh"
          label="Actualizar"
          @click="cargarEquipos"
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
          label="Buscar por tipo, marca, modelo, serie, ubicación o cliente"
          @update:model-value="cargarEquipos"
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
        title="Catálogo de equipos"
        :rows="equipos"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 20, 50, 0]"
        no-data-label="No hay equipos registrados"
      >
        <template #body-cell-equipo="props">
          <q-td :props="props">
            <div class="text-weight-bold">{{ props.row.tipo }}</div>
            <div class="text-caption text-grey-7">
              {{
                [props.row.marca, props.row.modelo]
                  .filter(Boolean)
                  .join(' · ') || 'Sin marca/modelo'
              }}
            </div>
          </q-td>
        </template>

        <template #body-cell-historial="props">
          <q-td :props="props">
            <q-chip dense outline color="primary" icon="history">
              {{ props.row.citas_count || 0 }} trabajos
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-activo="props">
          <q-td :props="props">
            <q-chip
              dense
              :color="props.row.activo ? 'positive' : 'grey'"
              text-color="white"
            >
              {{ props.row.activo ? 'Activo' : 'Inactivo' }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="table-actions">
            <ActionMenu
              @view="abrirVer(props.row)"
              @edit="abrirEditar(props.row)"
              @delete="eliminarEquipo(props.row)"
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
                >Ficha única del equipo y trazabilidad de sus trabajos</div
              >
            </div>
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
        </q-card-section>

        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-select
              v-model="form.cliente_id"
              :options="clientesOptions"
              emit-value
              map-options
              label="Cliente propietario"
              outlined
              clearable
              :readonly="modo === 'ver'"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="form.tipo"
              :options="tipoEquipoOptions"
              label="Tipo de equipo"
              outlined
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              new-value-mode="add-unique"
              :readonly="modo === 'ver'"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-select
              v-model="form.marca"
              :options="marcaOptions"
              label="Marca"
              outlined
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              new-value-mode="add-unique"
              :readonly="modo === 'ver'"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="form.modelo"
              label="Modelo"
              outlined
              :readonly="modo === 'ver'"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="form.serie"
              label="Serie / placa"
              outlined
              :readonly="modo === 'ver'"
            />
          </div>
          <div class="col-12 col-md-8">
            <q-input
              v-model="form.ubicacion"
              label="Ubicación del equipo"
              outlined
              :readonly="modo === 'ver'"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-toggle
              v-model="form.activo"
              label="Equipo activo"
              :disable="modo === 'ver'"
            />
          </div>
          <div class="col-12">
            <q-input
              v-model="form.observacion"
              label="Observación técnica"
              outlined
              type="textarea"
              rows="3"
              :readonly="modo === 'ver'"
            />
          </div>
        </q-card-section>

        <q-separator v-if="modo === 'ver'" />
        <q-card-section v-if="modo === 'ver'">
          <div class="text-subtitle1 text-weight-bold text-primary q-mb-sm"
            >Historial técnico del equipo</div
          >
          <q-list
            v-if="historialEquipo.length"
            bordered
            separator
            class="rounded-borders"
          >
            <q-item v-for="cita in historialEquipo" :key="cita.id">
              <q-item-section avatar
                ><q-icon name="engineering" color="primary"
              /></q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{
                  cita.servicio?.nombre || 'Servicio técnico'
                }}</q-item-label>
                <q-item-label caption
                  >{{ formatearFecha(cita.fecha) }} ·
                  {{
                    cita.cliente?.nombre ||
                    form.cliente?.nombre ||
                    'Sin cliente'
                  }}</q-item-label
                >
                <q-item-label
                  caption
                  v-if="cita.detalle_tecnico || cita.detalleTecnico"
                >
                  {{
                    (cita.detalle_tecnico || cita.detalleTecnico).diagnostico ||
                    'Detalle técnico registrado'
                  }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip
                  dense
                  :color="colorEstado(cita.estado)"
                  text-color="white"
                  >{{ textoEstado(cita.estado) }}</q-chip
                >
                <div class="text-caption text-right q-mt-xs"
                  >Bs {{ Number(cita.total || 0).toFixed(2) }}</div
                >
              </q-item-section>
            </q-item>
          </q-list>
          <q-banner v-else rounded class="bg-blue-1 text-primary">
            Este equipo todavía no tiene atenciones registradas. Cuando crees
            una atención con este equipo, su historial aparecerá aquí.
          </q-banner>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" color="grey-8" v-close-popup />
          <q-btn
            v-if="modo !== 'ver'"
            color="primary"
            icon="save"
            :label="modo === 'crear' ? 'Guardar equipo' : 'Actualizar equipo'"
            @click="guardarEquipo"
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
const equipos = ref([])
const clientes = ref([])
const dialogo = ref(false)
const modo = ref('crear')
const equipoId = ref(null)
const historialEquipo = ref([])

const tipoEquipoOptions = [
  'Aire acondicionado Split',
  'Aire acondicionado ventana',
  'Aire acondicionado central',
  'Refrigerador',
  'Freezer',
  'Cámara frigorífica',
  'Vitrina refrigerada',
  'Enfriador comercial',
  'Lavadora',
  'Otro'
]

const marcaOptions = [
  'LG',
  'Samsung',
  'Mabe',
  'Consul',
  'Whirlpool',
  'Electrolux',
  'Carrier',
  'York',
  'Midea',
  'TCL',
  'Hisense',
  'General Lux',
  'Otro'
]
const formInicial = {
  cliente_id: null,
  tipo: '',
  marca: '',
  modelo: '',
  serie: '',
  ubicacion: '',
  observacion: '',
  activo: true
}
const form = ref({ ...formInicial })

const clientesOptions = computed(() =>
  clientes.value.map(cliente => ({ label: cliente.nombre, value: cliente.id }))
)

const columns = [
  { name: 'acciones', label: '', field: 'acciones', align: 'center' },
  {
    name: 'cliente',
    label: 'Cliente',
    field: row => row.cliente?.nombre || 'Sin cliente',
    align: 'left',
    sortable: true
  },
  {
    name: 'equipo',
    label: 'Equipo',
    field: 'tipo',
    align: 'left',
    sortable: true
  },
  {
    name: 'serie',
    label: 'Serie',
    field: row => row.serie || '—',
    align: 'left'
  },
  {
    name: 'ubicacion',
    label: 'Ubicación',
    field: row => row.ubicacion || '—',
    align: 'left'
  },
  {
    name: 'historial',
    label: 'Historial',
    field: row => row.citas_count || 0,
    align: 'center'
  },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'center' }
]

const tituloDialogo = computed(() =>
  modo.value === 'crear'
    ? 'Registrar equipo'
    : modo.value === 'editar'
      ? 'Editar equipo'
      : 'Ver equipo'
)

const limpiarFormulario = () => {
  form.value = { ...formInicial }
  equipoId.value = null
  historialEquipo.value = []
}

const cargarClientes = async () => {
  const response = await api.get('/clientes')
  clientes.value = response.data.data || []
}

const cargarEquipos = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/equipos', {
      params: { buscar: buscar.value || undefined }
    })
    equipos.value = response.data.data || []
  } catch (err) {
    error.value = extraerMensajeError(
      err,
      'No se pudo cargar la lista de equipos.'
    )
  } finally {
    loading.value = false
  }
}

const abrirCrear = async () => {
  modo.value = 'crear'
  limpiarFormulario()
  await cargarClientes()
  dialogo.value = true
}

const abrirVer = async item => {
  modo.value = 'ver'
  equipoId.value = item.id
  await cargarClientes()
  const response = await api.get(`/equipos/${item.id}`)
  const equipo = response.data.data || item
  form.value = {
    ...equipo,
    cliente_id: equipo.cliente_id || equipo.cliente?.id || null
  }
  historialEquipo.value = [...(equipo.citas || [])].sort((a, b) =>
    String(b.fecha || '').localeCompare(String(a.fecha || ''))
  )
  dialogo.value = true
}

const abrirEditar = async item => {
  modo.value = 'editar'
  equipoId.value = item.id
  await cargarClientes()
  form.value = {
    ...item,
    cliente_id: item.cliente_id || item.cliente?.id || null
  }
  dialogo.value = true
}

const guardarEquipo = async () => {
  if (!form.value.tipo) {
    $q.notify({ type: 'warning', message: 'El tipo de equipo es obligatorio' })
    return
  }

  try {
    if (modo.value === 'crear') await api.post('/equipos', form.value)
    else await api.put(`/equipos/${equipoId.value}`, form.value)

    $q.notify({ type: 'positive', message: 'Equipo guardado correctamente' })
    dialogo.value = false
    limpiarFormulario()
    cargarEquipos()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo guardar el equipo')
    })
  }
}

const formatearFecha = value =>
  value ? date.formatDate(value, 'DD/MM/YYYY') : '—'
const textoEstado = estado =>
  ({
    pendiente: 'Pendiente',
    revision: 'En revisión',
    en_proceso: 'En proceso',
    esperando_repuesto: 'Esperando repuesto',
    terminado: 'Terminado',
    entregado: 'Entregado',
    concluida: 'Terminado',
    cancelada: 'Cancelado'
  })[estado] ||
  estado ||
  'Sin estado'
const colorEstado = estado =>
  ({
    pendiente: 'warning',
    revision: 'orange',
    en_proceso: 'info',
    esperando_repuesto: 'deep-orange',
    terminado: 'teal',
    entregado: 'positive',
    concluida: 'teal',
    cancelada: 'negative'
  })[estado] || 'grey'

const eliminarEquipo = item => {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Eliminar el equipo ${item.tipo}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/equipos/${item.id}`)
      $q.notify({ type: 'positive', message: 'Equipo eliminado correctamente' })
      cargarEquipos()
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: extraerMensajeError(err, 'No se pudo eliminar el equipo')
      })
    }
  })
}

onMounted(() => {
  cargarEquipos()
  cargarClientes()
})
</script>
