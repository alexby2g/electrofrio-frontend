<template>
  <q-page class="q-pa-md page-shell">
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">
          Clientes y equipos
        </div>
        <div class="text-subtitle2 text-grey-7">
          Un expediente por cliente con sus equipos, atenciones y pagos
        </div>
      </div>
      <div class="q-gutter-sm">
        <q-btn
          color="primary"
          icon="person_add"
          label="Nuevo cliente"
          @click="abrirCrear"
        />
        <q-btn
          outline
          color="primary"
          icon="refresh"
          label="Actualizar"
          @click="cargarClientes"
        />
      </div>
    </div>

    <q-banner rounded class="bg-blue-1 text-primary q-mb-md">
      <template #avatar><q-icon name="folder_shared" /></template>
      Registra al cliente una sola vez. Dentro de su expediente puedes añadir
      todos sus equipos y crear la siguiente atención con los datos ya
      seleccionados.
    </q-banner>

    <q-card class="content-card q-mb-md">
      <q-card-section>
        <q-input
          v-model="buscar"
          outlined
          dense
          clearable
          debounce="400"
          label="Buscar por nombre, teléfono, dirección o equipo"
          @update:model-value="cargarClientes"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </q-card-section>
    </q-card>

    <q-banner v-if="error" class="bg-red-1 text-red q-mb-md rounded-borders">
      {{ error }}
    </q-banner>

    <q-card class="content-card">
      <q-table
        title="Directorio de clientes"
        :rows="clientes"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 20, 50, 0]"
        no-data-label="No hay clientes registrados"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar color="primary" text-color="white" size="38px">
                {{ iniciales(props.row.nombre) }}
              </q-avatar>
              <div class="q-ml-sm">
                <div class="text-weight-bold">{{ props.row.nombre }}</div>
                <div class="text-caption text-grey-7">
                  {{ props.row.telefono || 'Sin teléfono' }}
                </div>
              </div>
            </div>
          </q-td>
        </template>
        <template #body-cell-equipos="props">
          <q-td :props="props">
            <q-chip dense outline color="primary" icon="devices_other">
              {{ props.row.equipos_count || 0 }}
            </q-chip>
          </q-td>
        </template>
        <template #body-cell-atenciones="props">
          <q-td :props="props">
            <q-chip dense outline color="info" icon="event_available">
              {{ props.row.citas_count || 0 }}
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
              @view="abrirExpediente(props.row)"
              @edit="abrirEditar(props.row)"
              @delete="eliminarCliente(props.row)"
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
          <div class="row items-center justify-between q-col-gutter-md">
            <div class="col">
              <div class="text-h6">{{ tituloDialogo }}</div>
              <div class="text-caption text-blue-1">
                Contacto, equipos e historial completo del cliente
              </div>
            </div>
            <div v-if="clienteId" class="col-auto q-gutter-sm">
              <q-btn
                unelevated
                color="white"
                text-color="primary"
                icon="add_task"
                label="Nueva atención"
                @click="crearAtencion"
              />
              <q-btn flat round dense icon="close" v-close-popup />
            </div>
            <q-btn v-else flat round dense icon="close" v-close-popup />
          </div>
        </q-card-section>

        <q-linear-progress v-if="detalleLoading" indeterminate color="accent" />

        <q-tabs
          v-if="clienteId"
          v-model="tabCliente"
          dense
          class="text-primary bg-blue-1"
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab name="datos" icon="person" label="Datos" />
          <q-tab
            name="equipos"
            icon="devices_other"
            :label="`Equipos (${clienteDetalle.equipos?.length || 0})`"
          />
          <q-tab
            name="historial"
            icon="history"
            :label="`Historial (${clienteDetalle.citas?.length || 0})`"
          />
          <q-tab
            name="pagos"
            icon="payments"
            :label="`Pagos (${clienteDetalle.pagos?.length || 0})`"
          />
        </q-tabs>

        <q-separator />

        <q-tab-panels
          v-if="clienteId"
          v-model="tabCliente"
          animated
          keep-alive
          class="client-panels"
        >
          <q-tab-panel name="datos">
            <q-form ref="clienteForm" class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.nombre"
                  label="Nombre completo"
                  outlined
                  :readonly="modo === 'ver'"
                  :rules="[v => !!v || 'El nombre es obligatorio']"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="form.telefono"
                  label="Teléfono / WhatsApp"
                  outlined
                  :readonly="modo === 'ver'"
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="form.direccion"
                  label="Dirección"
                  outlined
                  :readonly="modo === 'ver'"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-toggle
                  v-model="form.activo"
                  label="Cliente activo"
                  :disable="modo === 'ver'"
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="form.observacion"
                  label="Observación"
                  outlined
                  type="textarea"
                  rows="3"
                  :readonly="modo === 'ver'"
                />
              </div>
              <div class="col-12 text-right q-gutter-sm">
                <q-btn
                  v-if="modo === 'ver'"
                  outline
                  color="primary"
                  icon="edit"
                  label="Editar datos"
                  @click="modo = 'editar'"
                />
                <q-btn
                  v-if="modo === 'editar'"
                  color="primary"
                  icon="save"
                  label="Guardar cambios"
                  :loading="guardandoCliente"
                  @click="guardarCliente"
                />
              </div>
            </q-form>
          </q-tab-panel>

          <q-tab-panel name="equipos">
            <div class="row items-center justify-between q-mb-md">
              <div>
                <div class="text-h6 text-weight-bold">Equipos del cliente</div>
                <div class="text-caption text-grey-7">
                  Cada equipo conserva su propio historial técnico.
                </div>
              </div>
              <q-btn
                color="primary"
                icon="add"
                label="Agregar equipo"
                @click="abrirEquipo()"
              />
            </div>

            <q-table
              flat
              bordered
              :rows="clienteDetalle.equipos || []"
              :columns="columnasEquipos"
              row-key="id"
              :pagination="{ rowsPerPage: 10 }"
              no-data-label="Este cliente todavía no tiene equipos"
            >
              <template #body-cell-equipo="props">
                <q-td :props="props">
                  <div class="text-weight-bold">{{ props.row.tipo }}</div>
                  <div class="text-caption text-grey-7">
                    {{
                      [props.row.marca, props.row.modelo]
                        .filter(Boolean)
                        .join(' ') || 'Sin marca ni modelo'
                    }}
                  </div>
                </q-td>
              </template>
              <template #body-cell-estado="props">
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
                <q-td :props="props">
                  <ActionMenu
                    :show-view="false"
                    @edit="abrirEquipo(props.row)"
                    @delete="eliminarEquipo(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>

          <q-tab-panel name="historial">
            <div class="row items-center justify-between q-mb-md">
              <div>
                <div class="text-h6 text-weight-bold">
                  Historial de atenciones
                </div>
                <div class="text-caption text-grey-7">
                  Citas, trabajos y estados asociados al cliente.
                </div>
              </div>
              <q-btn
                color="primary"
                icon="add_task"
                label="Nueva atención"
                @click="crearAtencion"
              />
            </div>
            <q-table
              flat
              bordered
              :rows="clienteDetalle.citas || []"
              :columns="columnasHistorial"
              row-key="id"
              :pagination="{ rowsPerPage: 10 }"
              no-data-label="No hay atenciones para este cliente"
            >
              <template #body-cell-estado="props">
                <q-td :props="props">
                  <q-chip
                    dense
                    :color="colorEstado(props.row.estado)"
                    text-color="white"
                  >
                    {{ textoEstado(props.row.estado) }}
                  </q-chip>
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>

          <q-tab-panel name="pagos">
            <div class="text-h6 text-weight-bold q-mb-md">
              Pagos registrados
            </div>
            <q-table
              flat
              bordered
              :rows="clienteDetalle.pagos || []"
              :columns="columnasPagos"
              row-key="id"
              :pagination="{ rowsPerPage: 10 }"
              no-data-label="No hay pagos registrados para este cliente"
            />
          </q-tab-panel>
        </q-tab-panels>

        <q-card-section v-else>
          <q-form ref="clienteForm" class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.nombre"
                label="Nombre completo"
                outlined
                autofocus
                :rules="[v => !!v || 'El nombre es obligatorio']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.telefono"
                label="Teléfono / WhatsApp"
                outlined
              />
            </div>
            <div class="col-12">
              <q-input v-model="form.direccion" label="Dirección" outlined />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.observacion"
                label="Observación"
                outlined
                type="textarea"
                rows="3"
              />
            </div>
          </q-form>
          <div class="text-right q-mt-md">
            <q-btn
              color="primary"
              icon="save"
              label="Guardar y abrir expediente"
              :loading="guardandoCliente"
              @click="guardarCliente"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoEquipo" persistent>
      <q-card style="width: 720px; max-width: 95vw">
        <q-card-section class="bg-primary text-white">
          <div class="row items-center justify-between">
            <div>
              <div class="text-h6">{{ tituloEquipo }}</div>
              <div class="text-caption text-blue-1">
                {{ form.nombre || 'Cliente seleccionado' }}
              </div>
            </div>
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
        </q-card-section>
        <q-form ref="equipoForm">
          <q-card-section class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="formEquipo.tipo"
                label="Tipo de equipo"
                hint="Ej.: aire acondicionado, freezer o refrigerador"
                outlined
                :rules="[v => !!v || 'El tipo es obligatorio']"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input v-model="formEquipo.marca" label="Marca" outlined />
            </div>
            <div class="col-12 col-md-3">
              <q-input v-model="formEquipo.modelo" label="Modelo" outlined />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="formEquipo.serie"
                label="Serie / código"
                outlined
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="formEquipo.ubicacion"
                label="Ubicación"
                hint="Ej.: cocina, oficina o sucursal"
                outlined
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="formEquipo.observacion"
                label="Observación del equipo"
                type="textarea"
                rows="3"
                outlined
              />
            </div>
            <div class="col-12">
              <q-toggle v-model="formEquipo.activo" label="Equipo activo" />
            </div>
          </q-card-section>
        </q-form>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            color="primary"
            icon="save"
            label="Guardar equipo"
            :loading="guardandoEquipo"
            @click="guardarEquipo"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import ActionMenu from '../components/ActionMenu.vue'
import api, { extraerMensajeError } from '../services/api.js'

const $q = useQuasar()
const router = useRouter()
const loading = ref(false)
const detalleLoading = ref(false)
const guardandoCliente = ref(false)
const guardandoEquipo = ref(false)
const error = ref('')
const buscar = ref('')
const clientes = ref([])
const dialogo = ref(false)
const dialogoEquipo = ref(false)
const modo = ref('crear')
const clienteId = ref(null)
const equipoId = ref(null)
const tabCliente = ref('datos')
const clienteForm = ref(null)
const equipoForm = ref(null)
const clienteDetalle = ref({ equipos: [], citas: [], pagos: [] })

const formInicial = {
  nombre: '',
  telefono: '',
  direccion: '',
  observacion: '',
  activo: true
}
const equipoInicial = {
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
const formEquipo = ref({ ...equipoInicial })

const columns = [
  {
    name: 'acciones',
    label: '',
    field: 'acciones',
    align: 'center'
  },
  {
    name: 'nombre',
    label: 'Cliente',
    field: 'nombre',
    align: 'left',
    sortable: true
  },
  {
    name: 'direccion',
    label: 'Dirección',
    field: row => row.direccion || '—',
    align: 'left'
  },
  {
    name: 'equipos',
    label: 'Equipos',
    field: 'equipos_count',
    align: 'center',
    sortable: true
  },
  {
    name: 'atenciones',
    label: 'Atenciones',
    field: 'citas_count',
    align: 'center',
    sortable: true
  },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'center' }
]

const columnasEquipos = [
  {
    name: 'acciones',
    label: '',
    field: 'acciones',
    align: 'center'
  },
  { name: 'equipo', label: 'Equipo', field: 'tipo', align: 'left' },
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
  { name: 'estado', label: 'Estado', field: 'activo', align: 'center' }
]

const columnasHistorial = [
  {
    name: 'fecha',
    label: 'Fecha',
    field: row => formatearFecha(row.fecha),
    align: 'left',
    sortable: true
  },
  {
    name: 'servicio',
    label: 'Servicio',
    field: row => row.servicio?.nombre || row.descripcion || 'Servicio técnico',
    align: 'left'
  },
  {
    name: 'equipo',
    label: 'Equipo',
    field: row =>
      [row.equipo?.tipo, row.equipo?.marca, row.equipo?.modelo]
        .filter(Boolean)
        .join(' ') || 'Sin equipo',
    align: 'left'
  },
  {
    name: 'tecnico',
    label: 'Técnico',
    field: row => row.tecnico?.nombre || 'Sin asignar',
    align: 'left'
  },
  {
    name: 'total',
    label: 'Total',
    field: row => `Bs ${Number(row.total || 0).toFixed(2)}`,
    align: 'right'
  },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' }
]

const columnasPagos = [
  {
    name: 'fecha',
    label: 'Fecha',
    field: row => formatearFecha(row.fecha_pago || row.created_at),
    align: 'left'
  },
  {
    name: 'metodo',
    label: 'Método',
    field: row => row.metodo_pago || 'No indicado',
    align: 'left'
  },
  {
    name: 'estado',
    label: 'Estado',
    field: row => row.estado || 'Pendiente',
    align: 'left'
  },
  {
    name: 'monto',
    label: 'Monto',
    field: row => `Bs ${Number(row.monto || 0).toFixed(2)}`,
    align: 'right'
  }
]

const tituloDialogo = computed(() =>
  clienteId.value
    ? `Expediente · ${form.value.nombre || 'Cliente'}`
    : 'Registrar cliente'
)
const tituloEquipo = computed(() =>
  equipoId.value ? 'Editar equipo' : 'Agregar equipo'
)

const iniciales = nombre =>
  String(nombre || 'C')
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte.charAt(0))
    .join('')
    .toUpperCase()

const formatearFecha = valor => {
  if (!valor) return '—'
  const texto = String(valor)
  const fecha = new Date(texto.length === 10 ? `${texto}T12:00:00` : texto)
  return Number.isNaN(fecha.getTime())
    ? texto
    : new Intl.DateTimeFormat('es-BO').format(fecha)
}

const textoEstado = estado =>
  ({
    pendiente: 'Pendiente',
    revision: 'En revisión',
    en_proceso: 'En proceso',
    esperando_repuesto: 'Esperando repuesto',
    terminado: 'Terminado',
    concluida: 'Concluida',
    entregado: 'Entregado',
    cancelada: 'Cancelado'
  })[estado] ||
  estado ||
  'Pendiente'

const colorEstado = estado =>
  ({
    pendiente: 'warning',
    revision: 'orange',
    en_proceso: 'info',
    esperando_repuesto: 'deep-orange',
    terminado: 'teal',
    concluida: 'teal',
    entregado: 'positive',
    cancelada: 'negative'
  })[estado] || 'grey'

const copiarClienteAlFormulario = cliente => {
  form.value = {
    nombre: cliente?.nombre || '',
    telefono: cliente?.telefono || '',
    direccion: cliente?.direccion || '',
    observacion: cliente?.observacion || '',
    activo: cliente?.activo !== false
  }
}

const cargarClientes = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/clientes', {
      params: { buscar: buscar.value || undefined }
    })
    clientes.value = data.data || []
  } catch (err) {
    error.value = extraerMensajeError(
      err,
      'No se pudo cargar la lista de clientes.'
    )
  } finally {
    loading.value = false
  }
}

const cargarExpediente = async id => {
  detalleLoading.value = true
  try {
    const { data } = await api.get(`/clientes/${id}`)
    clienteDetalle.value = {
      ...data.data,
      equipos: data.data?.equipos || [],
      citas: data.data?.citas || [],
      pagos: data.data?.pagos || []
    }
    copiarClienteAlFormulario(clienteDetalle.value)
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo abrir el expediente')
    })
  } finally {
    detalleLoading.value = false
  }
}

const abrirCrear = () => {
  modo.value = 'crear'
  clienteId.value = null
  tabCliente.value = 'datos'
  clienteDetalle.value = { equipos: [], citas: [], pagos: [] }
  form.value = { ...formInicial }
  dialogo.value = true
}

const abrirExpediente = async cliente => {
  modo.value = 'ver'
  clienteId.value = cliente.id
  tabCliente.value = 'datos'
  copiarClienteAlFormulario(cliente)
  dialogo.value = true
  await cargarExpediente(cliente.id)
}

const abrirEditar = async cliente => {
  await abrirExpediente(cliente)
  modo.value = 'editar'
}

const guardarCliente = async () => {
  const ok = await clienteForm.value?.validate()
  if (!ok) return
  guardandoCliente.value = true
  try {
    const { data } = clienteId.value
      ? await api.put(`/clientes/${clienteId.value}`, form.value)
      : await api.post('/clientes', form.value)

    const guardado = data.data
    clienteId.value = guardado.id
    modo.value = 'ver'
    $q.notify({ type: 'positive', message: 'Cliente guardado correctamente' })
    await Promise.all([cargarClientes(), cargarExpediente(guardado.id)])
    tabCliente.value = clienteDetalle.value.equipos.length ? 'datos' : 'equipos'
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo guardar el cliente')
    })
  } finally {
    guardandoCliente.value = false
  }
}

const abrirEquipo = equipo => {
  equipoId.value = equipo?.id || null
  formEquipo.value = {
    ...equipoInicial,
    ...equipo,
    cliente_id: clienteId.value,
    activo: equipo ? equipo.activo !== false : true
  }
  dialogoEquipo.value = true
}

const guardarEquipo = async () => {
  const ok = await equipoForm.value?.validate()
  if (!ok) return
  guardandoEquipo.value = true
  try {
    if (equipoId.value) {
      await api.put(`/equipos/${equipoId.value}`, formEquipo.value)
    } else {
      await api.post('/equipos', formEquipo.value)
    }
    $q.notify({ type: 'positive', message: 'Equipo guardado correctamente' })
    dialogoEquipo.value = false
    await Promise.all([cargarExpediente(clienteId.value), cargarClientes()])
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo guardar el equipo')
    })
  } finally {
    guardandoEquipo.value = false
  }
}

const eliminarEquipo = equipo => {
  $q.dialog({
    title: 'Eliminar equipo',
    message: `¿Eliminar ${equipo.tipo}${equipo.marca ? ` ${equipo.marca}` : ''}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/equipos/${equipo.id}`)
      $q.notify({ type: 'positive', message: 'Equipo eliminado correctamente' })
      await Promise.all([cargarExpediente(clienteId.value), cargarClientes()])
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: extraerMensajeError(err, 'No se pudo eliminar el equipo')
      })
    }
  })
}

const crearAtencion = async () => {
  dialogo.value = false
  await router.push({
    name: 'citas',
    query: { nueva: '1', cliente_id: String(clienteId.value) }
  })
}

const eliminarCliente = cliente => {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Eliminar a ${cliente.nombre}? Sus relaciones existentes pueden impedir esta acción.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/clientes/${cliente.id}`)
      $q.notify({
        type: 'positive',
        message: 'Cliente eliminado correctamente'
      })
      cargarClientes()
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: extraerMensajeError(err, 'No se pudo eliminar el cliente')
      })
    }
  })
}

onMounted(cargarClientes)
</script>

<style scoped>
.client-panels {
  min-height: calc(100vh - 175px);
}
</style>
