<template>
  <q-page class="q-pa-md q-pa-lg-lg bg-grey-1">
    <div class="row items-center justify-between q-mb-lg q-gutter-md">
      <div>
        <div class="text-h4 text-weight-bold text-blue-grey-10">Usuarios</div>
        <div class="text-body1 text-grey-7">
          Accesos, teléfonos, roles y vinculación con técnicos
        </div>
      </div>
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="person_add"
        label="Nuevo usuario"
        @click="abrirNuevo"
      />
    </div>

    <q-card flat bordered class="q-pa-md">
      <q-input
        v-model.trim="buscar"
        outlined
        dense
        clearable
        debounce="350"
        placeholder="Buscar por nombre, usuario, teléfono, correo o rol"
        class="q-mb-md"
        @update:model-value="cargar"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <q-table
        flat
        :rows="usuarios"
        :columns="columnas"
        row-key="id"
        :loading="cargando"
        :rows-per-page-options="[10, 20, 50]"
      >
        <template #body-cell-name="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar
                size="38px"
                color="cyan-8"
                text-color="white"
                class="q-mr-sm"
              >
                {{ iniciales(props.row.name) }}
              </q-avatar>
              <div>
                <div class="text-weight-medium">{{ props.row.name }}</div>
                <div class="text-caption text-grey-6">
                  @{{ props.row.username }} · {{ props.row.email }}
                </div>
              </div>
            </div>
          </q-td>
        </template>
        <template #body-cell-telefono="props">
          <q-td :props="props">
            <div>{{ props.row.telefono || 'Sin teléfono' }}</div>
            <q-badge
              v-if="props.row.telefono_verificado_at"
              outline
              color="positive"
              label="Verificado"
            />
            <q-badge v-else outline color="warning" label="Pendiente" />
          </q-td>
        </template>
        <template #body-cell-rol="props">
          <q-td :props="props">
            <q-chip
              dense
              color="blue-1"
              text-color="primary"
              :label="textoRol(props.row.rol)"
            />
          </q-td>
        </template>
        <template #body-cell-activo="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.activo ? 'positive' : 'grey'"
              :label="props.row.activo ? 'Activo' : 'Inactivo'"
            />
          </q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props">
            <ActionMenu
              :show-view="false"
              @edit="abrirEditar(props.row)"
              @delete="confirmarEliminar(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogo">
      <q-card style="width: min(700px, 95vw)">
        <q-card-section class="row items-center">
          <div class="text-h6">
            {{ editandoId ? 'Editar usuario' : 'Nuevo usuario' }}
          </div>
          <q-space />
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>
        <q-separator />

        <q-form @submit.prevent="guardar">
          <q-card-section class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model.trim="form.name"
                outlined
                label="Nombre completo"
                :rules="[valor => Boolean(valor) || 'El nombre es obligatorio']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.trim="form.telefono"
                outlined
                label="Teléfono"
                hint="Formato recomendado: +59170000000"
                :rules="[
                  valor => Boolean(valor) || 'El teléfono es obligatorio'
                ]"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.trim="form.username"
                outlined
                label="Nombre de usuario"
                prefix="@"
                hint="Solo letras, números, punto, guion o guion bajo"
                :rules="[
                  valor =>
                    /^[a-zA-Z0-9._-]{3,60}$/.test(valor) ||
                    'Escribe un usuario válido'
                ]"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.trim="form.email"
                outlined
                type="email"
                label="Correo electrónico"
                :rules="[valor => /.+@.+\..+/.test(valor) || 'Correo inválido']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.password"
                outlined
                type="password"
                :label="
                  editandoId ? 'Nueva contraseña (opcional)' : 'Contraseña'
                "
                :rules="[
                  valor =>
                    editandoId ||
                    String(valor || '').length >= 8 ||
                    'Debe tener al menos 8 caracteres'
                ]"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.rol"
                outlined
                emit-value
                map-options
                label="Rol"
                :options="roles"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.tecnico_id"
                outlined
                clearable
                emit-value
                map-options
                label="Técnico relacionado"
                hint="Necesario para limitar sus atenciones y mensajes"
                :options="opcionesTecnicos"
                :disable="form.rol !== 'tecnico'"
              />
            </div>
            <div class="col-12">
              <q-toggle
                v-model="form.activo"
                color="positive"
                label="Usuario activo"
              />
            </div>
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md">
            <q-btn v-close-popup flat no-caps label="Cancelar" />
            <q-btn
              unelevated
              no-caps
              color="primary"
              label="Guardar usuario"
              type="submit"
              :loading="guardando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import ActionMenu from '../components/ActionMenu.vue'
import api, { extraerMensajeError } from '../services/api.js'

const $q = useQuasar()
const usuarios = ref([])
const tecnicos = ref([])
const buscar = ref('')
const cargando = ref(false)
const dialogo = ref(false)
const guardando = ref(false)
const editandoId = ref(null)

const formInicial = () => ({
  name: '',
  username: '',
  email: '',
  telefono: '+591',
  password: '',
  rol: 'recepcion',
  tecnico_id: null,
  activo: true
})

const form = reactive(formInicial())
const roles = [
  { label: 'Administrador', value: 'administrador' },
  { label: 'Recepción', value: 'recepcion' },
  { label: 'Técnico', value: 'tecnico' }
]

const columnas = [
  {
    name: 'acciones',
    label: '',
    field: 'acciones',
    align: 'center'
  },
  {
    name: 'name',
    label: 'Usuario',
    field: 'name',
    align: 'left',
    sortable: true
  },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left' },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'center', sortable: true },
  {
    name: 'tecnico',
    label: 'Técnico relacionado',
    field: row => row.tecnico?.nombre || '—',
    align: 'left'
  },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'center' }
]

const opcionesTecnicos = computed(() =>
  tecnicos.value.map(item => ({ label: item.nombre, value: item.id }))
)

watch(
  () => form.rol,
  rol => {
    if (rol !== 'tecnico') form.tecnico_id = null
  }
)

onMounted(async () => {
  await Promise.all([cargar(), cargarTecnicos()])
})

const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/usuarios', {
      params: { buscar: buscar.value || undefined }
    })
    usuarios.value = data
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(error, 'No se pudieron cargar los usuarios.')
    })
  } finally {
    cargando.value = false
  }
}

const cargarTecnicos = async () => {
  const { data } = await api.get('/tecnicos')
  tecnicos.value = data.data || []
}

const abrirNuevo = () => {
  editandoId.value = null
  Object.assign(form, formInicial())
  dialogo.value = true
}

const abrirEditar = usuario => {
  editandoId.value = usuario.id
  Object.assign(form, {
    name: usuario.name,
    username: usuario.username || '',
    email: usuario.email,
    telefono: usuario.telefono || '+591',
    password: '',
    rol: usuario.rol,
    tecnico_id: usuario.tecnico_id || null,
    activo: Boolean(usuario.activo)
  })
  dialogo.value = true
}

const guardar = async () => {
  guardando.value = true
  const payload = { ...form }
  if (editandoId.value && !payload.password) delete payload.password

  try {
    if (editandoId.value) {
      await api.put(`/usuarios/${editandoId.value}`, payload)
    } else {
      await api.post('/usuarios', payload)
    }
    dialogo.value = false
    await cargar()
    $q.notify({ type: 'positive', message: 'Usuario guardado correctamente.' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: extraerMensajeError(error, 'No se pudo guardar el usuario.')
    })
  } finally {
    guardando.value = false
  }
}

const confirmarEliminar = usuario => {
  $q.dialog({
    title: 'Eliminar usuario',
    message: `¿Seguro que deseas eliminar a ${usuario.name}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/usuarios/${usuario.id}`)
      await cargar()
      $q.notify({ type: 'positive', message: 'Usuario eliminado.' })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: extraerMensajeError(error, 'No se pudo eliminar el usuario.')
      })
    }
  })
}

const textoRol = rol => roles.find(item => item.value === rol)?.label || rol
const iniciales = nombre =>
  String(nombre || 'U')
    .split(' ')
    .slice(0, 2)
    .map(item => item[0])
    .join('')
    .toUpperCase()
</script>
