<template>
  <q-page class="q-pa-md clientes-page">

    <div class="row justify-between items-center q-mb-md page-header">
      <div>
        <div class="text-h5 text-primary text-weight-bold">
          Clientes
        </div>

        <div class="text-caption text-grey-7">
          Registro de clientes de Electro Frío
        </div>
      </div>

      <q-btn
        class="btn-electrofrio btn-page"
        icon="add"
        label="Nuevo Cliente"
        @click="abrirDialog"
      />
    </div>

    <q-card class="filtros-card q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-center filtros-responsive">

          <div class="col-12 col-md-6">
            <q-input
              v-model="filtro"
              outlined
              dense
              rounded
              clearable
              debounce="300"
              placeholder="Buscar por nombre, teléfono o dirección..."
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filtroContacto"
              :options="opcionesContacto"
              label="Filtro"
              outlined
              dense
              rounded
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-3">
            <q-chip
              color="primary"
              text-color="white"
              icon="groups"
              class="q-pa-md chip-total"
            >
              {{ clientesFiltrados.length }} cliente(s)
            </q-chip>
          </div>

        </div>
      </q-card-section>
    </q-card>

    <q-table
      class="tabla-electrofrio"
      :rows="clientesFiltrados"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      no-data-label="No hay clientes registrados"
      :pagination="pagination"
      :rows-per-page-options="[5, 10, 15, 20, 0]"
    >

      <template #body-cell-cliente="props">
        <q-td :props="props">

          <div class="row items-center no-wrap">
            <q-avatar class="avatar-cliente q-mr-sm" size="42px">
              {{ inicialCliente(props.row.nombre) }}
            </q-avatar>

            <div>
              <div class="text-weight-bold text-primary">
                {{ props.row.nombre }}
              </div>

              <div class="text-caption text-grey-7">
                Cliente registrado
              </div>
            </div>
          </div>

        </q-td>
      </template>

      <template #body-cell-contacto="props">
        <q-td :props="props">

          <div>
            📞 {{ props.row.telefono || 'Sin teléfono' }}
          </div>

          <div class="text-caption text-grey-7">
            📍 {{ props.row.direccion || 'Sin dirección' }}
          </div>

          <div class="q-mt-xs">
            <q-badge
              rounded
              :color="props.row.telefono ? 'green' : 'orange'"
              :label="props.row.telefono ? 'Con contacto' : 'Sin contacto'"
            />
          </div>

        </q-td>
      </template>

      <template #body-cell-acciones="props">
        <q-td :props="props" class="q-gutter-xs text-center">

          <q-btn
            size="sm"
            round
            unelevated
            color="primary"
            icon="edit"
            @click="editar(props.row)"
          >
            <q-tooltip>Editar</q-tooltip>
          </q-btn>

          <q-btn
            size="sm"
            round
            unelevated
            color="negative"
            icon="delete"
            @click="eliminar(props.row.id)"
          >
            <q-tooltip>Eliminar</q-tooltip>
          </q-btn>

        </q-td>
      </template>

    </q-table>

    <q-dialog v-model="dialog" persistent>
      <q-card class="dialog-card">

        <q-card-section class="dialog-header row items-center">
          <div class="text-h6">
            {{ editando ? 'Editar Cliente' : 'Nuevo Cliente' }}
          </div>

          <q-space />

          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-scroll-area class="dialog-scroll">

          <q-card-section class="q-gutter-md q-pt-lg">

            <q-input
              v-model.trim="form.nombre"
              label="Nombre completo"
              outlined
              dense
              rounded
              :rules="[val => !!val || 'El nombre es obligatorio']"
            />

            <q-input
              v-model.trim="form.telefono"
              label="Teléfono"
              outlined
              dense
              rounded
            />

            <q-input
              v-model.trim="form.direccion"
              label="Dirección"
              outlined
              dense
              rounded
            />

          </q-card-section>

        </q-scroll-area>

        <q-card-actions align="right" class="dialog-actions">

          <q-btn
            flat
            label="Cancelar"
            color="grey-7"
            v-close-popup
          />

          <q-btn
            class="btn-electrofrio"
            :label="editando ? 'Actualizar' : 'Guardar'"
            @click="guardar"
            :loading="submitting"
          />

        </q-card-actions>

      </q-card>
    </q-dialog>

  </q-page>
</template>

<script>
import { api } from 'boot/axios'

export default {
  name: 'ClientesPage',

  data() {
    return {
      loading: false,
      submitting: false,
      clientes: [],
      filtro: '',
      filtroContacto: 'todos',
      dialog: false,
      editando: false,
      form: this.formVacio(),

      pagination: {
        rowsPerPage: 5
      },

      opcionesContacto: [
        { label: 'Todos', value: 'todos' },
        { label: 'Con teléfono', value: 'con_telefono' },
        { label: 'Sin teléfono', value: 'sin_telefono' },
        { label: 'Con dirección', value: 'con_direccion' },
        { label: 'Sin dirección', value: 'sin_direccion' }
      ],

      columns: [
        { name: 'cliente', label: 'Cliente', align: 'left' },
        { name: 'contacto', label: 'Contacto', align: 'left' },
        { name: 'acciones', label: 'Acciones', align: 'center' }
      ]
    }
  },

  computed: {
    clientesFiltrados() {
      let lista = [...this.clientes]

      if (this.filtro) {
        const texto = this.filtro.toLowerCase()

        lista = lista.filter(cliente => {
          return (
            String(cliente.nombre || '').toLowerCase().includes(texto) ||
            String(cliente.telefono || '').toLowerCase().includes(texto) ||
            String(cliente.direccion || '').toLowerCase().includes(texto)
          )
        })
      }

      if (this.filtroContacto === 'con_telefono') {
        lista = lista.filter(cliente => !!cliente.telefono)
      }

      if (this.filtroContacto === 'sin_telefono') {
        lista = lista.filter(cliente => !cliente.telefono)
      }

      if (this.filtroContacto === 'con_direccion') {
        lista = lista.filter(cliente => !!cliente.direccion)
      }

      if (this.filtroContacto === 'sin_direccion') {
        lista = lista.filter(cliente => !cliente.direccion)
      }

      return lista
    }
  },

  mounted() {
    this.cargar()
  },

  methods: {
    formVacio() {
      return {
        id: null,
        nombre: '',
        telefono: '',
        direccion: ''
      }
    },

    inicialCliente(nombre) {
      if (!nombre) return '?'
      return nombre.trim().charAt(0).toUpperCase()
    },

    obtenerLista(res) {
      return Array.isArray(res.data) ? res.data : (res.data?.data || [])
    },

    mensajeError(error, defecto) {
      const errores = error.response?.data?.errors
      if (errores) return Object.values(errores).flat()[0]
      return error.response?.data?.message || error.response?.data?.mensaje || defecto
    },

    async cargar() {
      this.loading = true

      try {
        const res = await api.get('/clientes')
        this.clientes = this.obtenerLista(res)
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.mensajeError(error, 'Error al cargar clientes')
        })
      } finally {
        this.loading = false
      }
    },

    abrirDialog() {
      this.form = this.formVacio()
      this.editando = false
      this.dialog = true
    },

    validar() {
      if (!this.form.nombre) {
        this.$q.notify({
          type: 'warning',
          message: 'El nombre del cliente es obligatorio'
        })

        return false
      }

      return true
    },

    async guardar() {
      if (!this.validar()) return

      this.submitting = true

      try {
        const payload = {
          nombre: this.form.nombre,
          telefono: this.form.telefono || null,
          direccion: this.form.direccion || null
        }

        if (this.editando) {
          await api.put(`/clientes/${this.form.id}`, payload)
        } else {
          await api.post('/clientes', payload)
        }

        this.$q.notify({
          type: 'positive',
          message: this.editando ? 'Cliente actualizado' : 'Cliente registrado'
        })

        this.dialog = false
        await this.cargar()

      } catch (error) {

        this.$q.notify({
          type: 'negative',
          message: this.mensajeError(error, 'Error al guardar cliente')
        })

      } finally {

        this.submitting = false

      }
    },

    editar(row) {
      this.form = {
        id: row.id,
        nombre: row.nombre || '',
        telefono: row.telefono || '',
        direccion: row.direccion || ''
      }

      this.editando = true
      this.dialog = true
    },

    eliminar(id) {
      const cliente = this.clientes.find(c => Number(c.id) === Number(id))

      this.$q.dialog({
        title: 'Confirmar eliminación',
        message: '¿Eliminar este cliente? Se guardará en historial.',
        cancel: true,
        persistent: true
      }).onOk(async () => {

        try {

          if (cliente) {
            const historial = JSON.parse(localStorage.getItem('clientes_eliminados') || '[]')

            historial.unshift({
              ...cliente,
              fecha_eliminacion: new Date().toLocaleString()
            })

            localStorage.setItem('clientes_eliminados', JSON.stringify(historial))
          }

          await api.delete(`/clientes/${id}`)

          this.$q.notify({
            type: 'positive',
            message: 'Cliente eliminado y guardado en historial'
          })

          await this.cargar()

        } catch (error) {

          this.$q.notify({
            type: 'negative',
            message: this.mensajeError(error, 'No se pudo eliminar el cliente')
          })

        }

      })
    }
  }
}
</script>

<style scoped>
.clientes-page {
  min-height: 100vh;
}

.filtros-card {
  border-radius: 22px;
  box-shadow: 0 12px 30px rgba(13, 71, 161, 0.10);
}

.chip-total {
  width: 100%;
  justify-content: center;
  font-weight: 800;
}

.avatar-cliente {
  background: linear-gradient(135deg, #0d47a1, #c62828);
  color: white;
  font-weight: 800;
}

.tabla-electrofrio {
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 14px 35px rgba(13, 71, 161, 0.12);
  background: white;
}

.tabla-electrofrio :deep(.q-table thead tr) {
  background: linear-gradient(135deg, #0d47a1, #c62828);
  color: white;
}

.tabla-electrofrio :deep(.q-table th) {
  font-weight: 700;
  font-size: 14px;
}

.tabla-electrofrio :deep(.q-table tbody tr) {
  transition: all 0.2s ease;
}

.tabla-electrofrio :deep(.q-table tbody tr:hover) {
  background: #eef4ff;
}

.dialog-card {
  width: 420px;
  max-width: 95vw;
  max-height: 90vh;
  border-radius: 22px;
  overflow: hidden;
}

.dialog-scroll {
  max-height: 65vh;
}

.dialog-actions {
  padding: 12px 18px 18px 18px;
  background: white;
  border-top: 1px solid #eeeeee;
}

.dialog-header {
  background: linear-gradient(135deg, #0d47a1, #c62828);
  color: white;
}

@media (max-width: 600px) {

  .clientes-page {
    padding: 10px;
  }

  .page-header {
    gap: 12px;
  }

  .btn-page {
    width: 100%;
  }

  .filtros-responsive {
    display: flex;
    flex-direction: column;
  }

  .filtros-responsive > div {
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
  }

  .dialog-card {
    width: 95vw;
    max-width: 95vw;
    border-radius: 18px;
  }

  .dialog-actions {
    flex-wrap: wrap;
    gap: 10px;
  }

  .dialog-actions .q-btn {
    flex: 1;
  }

  .tabla-electrofrio {
    border-radius: 16px;
  }

}
</style>