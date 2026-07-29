<template>
  <q-page class="q-pa-md page-shell">
    <div class="row items-center justify-between q-mb-md q-col-gutter-md">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Servicios</div>
        <div class="text-subtitle2 text-grey-7"
          >Catálogo dinámico de trabajos técnicos, referencias y precios</div
        >
      </div>
      <div class="q-gutter-sm">
        <q-btn
          color="primary"
          icon="add"
          :label="labelNuevoServicio"
          @click="abrirCrear()"
        />
        <q-btn
          color="primary"
          outline
          icon="refresh"
          label="Actualizar"
          @click="cargarServicios"
        />
      </div>
    </div>

    <q-card class="content-card q-mb-md">
      <q-card-section class="row q-col-gutter-md items-center">
        <div class="col-12 col-md-8">
          <q-input
            v-model="buscar"
            outlined
            dense
            clearable
            debounce="250"
            label="Buscar servicio, descripción o categoría"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-12 col-md-4 row justify-md-end q-gutter-sm">
          <q-chip outline color="primary" icon="sell"
            >{{ serviciosFiltrados.length }} de
            {{ servicios.length }} servicios</q-chip
          >
          <q-btn
            v-if="hayFiltroActivo"
            dense
            flat
            color="primary"
            icon="filter_alt_off"
            label="Ver todos"
            @click="limpiarFiltros"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-banner v-if="error" class="bg-red-1 text-red q-mb-md rounded-borders">{{
      error
    }}</q-banner>

    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="ref in referenciasConMetricas"
        :key="ref.key"
        class="col-12 col-sm-6 col-md-3"
      >
        <q-card
          flat
          bordered
          class="reference-card category-card q-pa-md"
          :class="{
            'reference-card--active': categoriaSeleccionada === ref.key
          }"
          @click="seleccionarCategoria(ref.key)"
        >
          <div class="row items-start justify-between no-wrap">
            <q-icon :name="ref.icon" color="primary" size="30px" />
            <q-badge rounded color="primary" :label="ref.total" />
          </div>

          <div class="text-weight-bold q-mt-sm">{{ ref.nombre }}</div>
          <div class="text-caption text-grey-7">{{ ref.detalle }}</div>

          <div class="row items-center justify-between q-mt-md q-gutter-sm">
            <q-chip
              dense
              square
              color="blue-1"
              text-color="primary"
              icon="payments"
            >
              {{
                ref.promedio > 0
                  ? `Prom. Bs ${ref.promedio.toFixed(2)}`
                  : 'Sin precios'
              }}
            </q-chip>
          </div>

          <q-separator spaced />

          <div class="row justify-between items-center no-wrap">
            <q-btn
              dense
              flat
              color="primary"
              icon="filter_alt"
              :label="categoriaSeleccionada === ref.key ? 'Activo' : 'Filtrar'"
              @click.stop="seleccionarCategoria(ref.key)"
            />
            <q-btn
              dense
              unelevated
              color="primary"
              icon="add"
              label="Crear"
              @click.stop="abrirCrear(ref.key)"
            />
          </div>
        </q-card>
      </div>
    </div>

    <q-card class="content-card">
      <q-table
        :title="tituloTabla"
        :rows="serviciosFiltrados"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 20, 50, 0]"
        no-data-label="No hay servicios registrados con este filtro"
      >
        <template #body-cell-servicio="props">
          <q-td :props="props">
            <div class="text-weight-bold">{{ props.row.nombre }}</div>
            <div class="text-caption text-grey-7 ellipsis-2-lines">{{
              props.row.descripcion || 'Sin descripción'
            }}</div>
          </q-td>
        </template>

        <template #body-cell-categoria="props">
          <q-td :props="props">
            <q-chip
              dense
              color="blue-1"
              text-color="primary"
              :icon="iconoCategoria(props.row)"
            >
              {{ etiquetaCategoria(categoriaPorServicio(props.row)) }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-precio="props">
          <q-td :props="props"
            ><span class="money-pill"
              >Bs {{ Number(props.row.precio || 0).toFixed(2) }}</span
            ></q-td
          >
        </template>

        <template #body-cell-activo="props">
          <q-td :props="props">
            <q-chip
              dense
              :color="props.row.activo ? 'positive' : 'grey'"
              text-color="white"
              >{{ props.row.activo ? 'Activo' : 'Inactivo' }}</q-chip
            >
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="table-actions">
            <ActionMenu
              @view="abrirVer(props.row)"
              @edit="abrirEditar(props.row)"
              @delete="eliminarServicio(props.row)"
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
                >Define categoría, servicio y precio base para usarlo después en
                citas y pagos</div
              >
            </div>
            <q-btn flat round dense icon="close" v-close-popup />
          </div>
        </q-card-section>

        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-5">
            <q-select
              v-model="form.categoria"
              :options="categoriaOptions"
              label="Categoría"
              outlined
              emit-value
              map-options
              :readonly="modo === 'ver'"
            />
          </div>
          <div class="col-12 col-md-7">
            <q-select
              v-model="form.nombre"
              :options="servicioReferenciaOptions"
              label="Nombre del servicio"
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
              v-model.number="form.precio"
              label="Precio base"
              outlined
              type="number"
              prefix="Bs"
              :readonly="modo === 'ver'"
            />
          </div>
          <div class="col-12 col-md-8 row items-center">
            <q-toggle
              v-model="form.activo"
              label="Servicio activo"
              :disable="modo === 'ver'"
            />
          </div>
          <div class="col-12">
            <q-input
              v-model="form.descripcion"
              label="Descripción / alcance del trabajo"
              outlined
              type="textarea"
              rows="4"
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
            :label="
              modo === 'crear' ? 'Guardar servicio' : 'Actualizar servicio'
            "
            @click="guardarServicio"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import ActionMenu from '../components/ActionMenu.vue'
import api, { extraerMensajeError } from '../services/api.js'

const $q = useQuasar()
const loading = ref(false)
const error = ref('')
const buscar = ref('')
const servicios = ref([])
const dialogo = ref(false)
const modo = ref('crear')
const servicioId = ref(null)
const categoriaSeleccionada = ref('todos')

const categoriaOptions = [
  { label: 'Diagnóstico', value: 'diagnostico', icon: 'search' },
  { label: 'Preventivo', value: 'preventivo', icon: 'cleaning_services' },
  { label: 'Correctivo', value: 'correctivo', icon: 'handyman' },
  { label: 'Instalación', value: 'instalacion', icon: 'ac_unit' },
  { label: 'Otro', value: 'otro', icon: 'more_horiz' }
]

const servicioReferenciaOptions = [
  'Diagnóstico técnico',
  'Revisión técnica de refrigerador',
  'Mantenimiento preventivo',
  'Limpieza profunda',
  'Mantenimiento correctivo',
  'Reparación de fuga',
  'Cambio de compresor',
  'Cambio de capacitor',
  'Revisión eléctrica',
  'Instalación de aire acondicionado',
  'Reubicación de equipo',
  'Carga de gas refrigerante'
]

const referencias = [
  {
    key: 'diagnostico',
    nombre: 'Diagnóstico',
    detalle: 'Ideal para primera visita',
    icon: 'search',
    plantilla: {
      nombre: 'Diagnóstico técnico',
      descripcion:
        'Revisión inicial del equipo, identificación de falla y recomendación técnica.',
      precio: 80
    }
  },
  {
    key: 'preventivo',
    nombre: 'Preventivo',
    detalle: 'Limpieza y revisión general',
    icon: 'cleaning_services',
    plantilla: {
      nombre: 'Mantenimiento preventivo',
      descripcion:
        'Limpieza general del equipo, revisión de funcionamiento y recomendaciones.',
      precio: 150
    }
  },
  {
    key: 'correctivo',
    nombre: 'Correctivo',
    detalle: 'Reparación con detalle técnico',
    icon: 'handyman',
    plantilla: {
      nombre: 'Mantenimiento correctivo',
      descripcion:
        'Reparación de falla detectada, pruebas de funcionamiento y detalle técnico.',
      precio: 300
    }
  },
  {
    key: 'instalacion',
    nombre: 'Instalación',
    detalle: 'Equipo nuevo o reubicación',
    icon: 'ac_unit',
    plantilla: {
      nombre: 'Instalación de aire acondicionado',
      descripcion:
        'Instalación o reubicación del equipo con verificación de funcionamiento.',
      precio: 250
    }
  }
]

const formInicial = {
  nombre: '',
  descripcion: '',
  categoria: 'diagnostico',
  precio: 0,
  activo: true
}
const form = ref({ ...formInicial })

const columns = [
  { name: 'acciones', label: '', field: 'acciones', align: 'center' },
  {
    name: 'servicio',
    label: 'Servicio',
    field: 'nombre',
    align: 'left',
    sortable: true
  },
  {
    name: 'categoria',
    label: 'Categoría',
    field: 'categoria',
    align: 'left',
    sortable: true
  },
  {
    name: 'precio',
    label: 'Precio',
    field: 'precio',
    align: 'right',
    sortable: true
  },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'center' }
]

const tituloDialogo = computed(() =>
  modo.value === 'crear'
    ? 'Registrar servicio'
    : modo.value === 'editar'
      ? 'Editar servicio'
      : 'Ver servicio'
)
const hayFiltroActivo = computed(
  () => Boolean(buscar.value) || categoriaSeleccionada.value !== 'todos'
)
const categoriaActiva = computed(() =>
  referencias.find(ref => ref.key === categoriaSeleccionada.value)
)
const labelNuevoServicio = computed(() =>
  categoriaActiva.value
    ? `Nuevo ${categoriaActiva.value.nombre}`
    : 'Nuevo servicio'
)
const tituloTabla = computed(() =>
  categoriaActiva.value
    ? `Lista de servicios - ${categoriaActiva.value.nombre}`
    : 'Lista de servicios y precios'
)

const normalizar = valor =>
  String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
const textoServicio = servicio =>
  normalizar(
    `${servicio.nombre || ''} ${servicio.descripcion || ''} ${servicio.categoria || ''}`
  )

const categoriaPorServicio = servicio => {
  if (servicio.categoria) return servicio.categoria

  const texto = textoServicio(servicio)
  if (texto.includes('diagn') || texto.includes('revisi')) return 'diagnostico'
  if (
    texto.includes('prevent') ||
    texto.includes('mantenimiento') ||
    texto.includes('limpieza')
  )
    return 'preventivo'
  if (texto.includes('instal') || texto.includes('reubic')) return 'instalacion'
  if (
    texto.includes('correct') ||
    texto.includes('repar') ||
    texto.includes('fuga') ||
    texto.includes('compresor') ||
    texto.includes('capacitor')
  )
    return 'correctivo'

  return 'otro'
}

const etiquetaCategoria = categoria =>
  categoriaOptions.find(option => option.value === categoria)?.label || 'Otro'
const iconoCategoria = servicio =>
  categoriaOptions.find(
    option => option.value === categoriaPorServicio(servicio)
  )?.icon || 'more_horiz'

const serviciosFiltrados = computed(() => {
  const textoBusqueda = normalizar(buscar.value)

  return servicios.value.filter(servicio => {
    const coincideBusqueda =
      !textoBusqueda ||
      textoServicio(servicio).includes(textoBusqueda) ||
      normalizar(etiquetaCategoria(categoriaPorServicio(servicio))).includes(
        textoBusqueda
      )

    const coincideCategoria =
      categoriaSeleccionada.value === 'todos' ||
      categoriaPorServicio(servicio) === categoriaSeleccionada.value

    return coincideBusqueda && coincideCategoria
  })
})

const referenciasConMetricas = computed(() =>
  referencias.map(ref => {
    const lista = servicios.value.filter(
      servicio => categoriaPorServicio(servicio) === ref.key
    )
    const totalPrecio = lista.reduce(
      (suma, servicio) => suma + Number(servicio.precio || 0),
      0
    )

    return {
      ...ref,
      total: lista.length,
      promedio: lista.length ? totalPrecio / lista.length : 0
    }
  })
)

const limpiarFormulario = () => {
  form.value = { ...formInicial }
  servicioId.value = null
}

const seleccionarCategoria = categoria => {
  categoriaSeleccionada.value =
    categoriaSeleccionada.value === categoria ? 'todos' : categoria
}

const limpiarFiltros = () => {
  buscar.value = ''
  categoriaSeleccionada.value = 'todos'
}

const cargarServicios = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/servicios')
    servicios.value = response.data.data || []
  } catch (err) {
    error.value = extraerMensajeError(
      err,
      'No se pudo cargar la lista de servicios.'
    )
  } finally {
    loading.value = false
  }
}

const abrirCrear = (categoria = null) => {
  modo.value = 'crear'
  limpiarFormulario()

  const categoriaBase =
    categoria ||
    (categoriaSeleccionada.value !== 'todos'
      ? categoriaSeleccionada.value
      : 'diagnostico')
  const referencia = referencias.find(ref => ref.key === categoriaBase)

  if (referencia) {
    form.value = {
      ...formInicial,
      categoria: referencia.key,
      nombre: referencia.plantilla.nombre,
      descripcion: referencia.plantilla.descripcion,
      precio: referencia.plantilla.precio
    }
  } else {
    form.value = { ...formInicial, categoria: 'otro' }
  }

  dialogo.value = true
}

const abrirVer = servicio => {
  modo.value = 'ver'
  servicioId.value = servicio.id
  form.value = { ...servicio, categoria: categoriaPorServicio(servicio) }
  dialogo.value = true
}

const abrirEditar = servicio => {
  modo.value = 'editar'
  servicioId.value = servicio.id
  form.value = { ...servicio, categoria: categoriaPorServicio(servicio) }
  dialogo.value = true
}

const guardarServicio = async () => {
  if (!form.value.nombre) {
    $q.notify({
      type: 'warning',
      message: 'El nombre del servicio es obligatorio'
    })
    return
  }

  try {
    if (modo.value === 'crear') await api.post('/servicios', form.value)
    else await api.put(`/servicios/${servicioId.value}`, form.value)

    $q.notify({
      type: 'positive',
      message:
        modo.value === 'crear'
          ? 'Servicio registrado correctamente'
          : 'Servicio actualizado correctamente'
    })
    dialogo.value = false
    limpiarFormulario()
    cargarServicios()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(err, 'No se pudo guardar el servicio')
    })
  }
}

const eliminarServicio = servicio => {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Eliminar el servicio ${servicio.nombre}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/servicios/${servicio.id}`)
      $q.notify({
        type: 'positive',
        message: 'Servicio eliminado correctamente'
      })
      cargarServicios()
    } catch (err) {
      $q.notify({
        type: 'negative',
        message: extraerMensajeError(err, 'No se pudo eliminar el servicio')
      })
    }
  })
}

onMounted(cargarServicios)
</script>
