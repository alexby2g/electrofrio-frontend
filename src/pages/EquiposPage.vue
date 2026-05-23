<template>
  <q-page class="q-pa-md equipos-page">
    <div class="row justify-between items-center q-mb-md page-header">
      <div>
        <div class="text-h5 text-primary text-weight-bold">
          Gestión de Equipos
        </div>

        <div class="text-caption text-grey-7">
          Aires acondicionados registrados por cliente
        </div>
      </div>

      <q-btn
        class="btn-electrofrio btn-page"
        icon="add"
        label="Nuevo Equipo"
        @click="abrirDialog"
      />
    </div>

    <q-table
      class="tabla-electrofrio"
      :rows="equipos"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      no-data-label="No hay equipos registrados"
    >
      <template #body-cell-equipo="props">
        <q-td :props="props">
          <div class="text-weight-bold text-primary">
            {{ props.row.tipo || 'Equipo sin tipo' }}
          </div>

          <div class="text-caption text-grey-7">
            {{ props.row.marca || 'Sin marca' }} - {{ props.row.modelo || 'Sin modelo' }}
          </div>
        </q-td>
      </template>

      <template #body-cell-cliente="props">
        <q-td :props="props">
          <div>
            👤 {{ props.row.cliente?.nombre || 'Sin cliente' }}
          </div>

          <div class="text-caption text-cyan-8">
            ❄ {{ props.row.capacidad || 'Sin capacidad' }}
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
          />

          <q-btn
            size="sm"
            round
            unelevated
            color="negative"
            icon="delete"
            @click="eliminar(props.row.id)"
          />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog" persistent>
      <q-card class="dialog-card">
        <q-card-section class="dialog-header row items-center">
          <div class="text-h6">
            {{ editando ? 'Editar Equipo' : 'Nuevo Equipo' }}
          </div>

          <q-space />

          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-scroll-area class="dialog-scroll">
          <q-card-section class="q-gutter-md q-pt-lg">
            <q-select
              v-model="form.cliente_id"
              :options="clientes"
              label="Cliente propietario"
              option-label="nombre"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
              rounded
            />

            <q-select
              v-model="form.tipo"
              :options="tiposEquipo"
              label="Tipo de equipo"
              outlined
              dense
              rounded
            />

            <div class="row q-col-gutter-sm form-row-responsive">
              <q-select
                class="col-6"
                v-model="form.marca"
                :options="marcas"
                label="Marca"
                outlined
                dense
                rounded
                use-input
                input-debounce="0"
                new-value-mode="add-unique"
              />

              <q-input
                class="col-6"
                v-model.trim="form.modelo"
                label="Modelo"
                outlined
                dense
                rounded
              />
            </div>

            <q-select
              v-model="form.capacidad"
              :options="capacidades"
              label="Capacidad"
              outlined
              dense
              rounded
              use-input
              input-debounce="0"
              new-value-mode="add-unique"
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
  name: 'EquiposPage',

  data() {
    return {
      loading: false,
      submitting: false,
      dialog: false,
      editando: false,
      equipos: [],
      clientes: [],

      tiposEquipo: [
        'Aire acondicionado Split',
        'Aire acondicionado de ventana',
        'Aire acondicionado portátil',
        'Aire acondicionado central'
      ],

      marcas: [
        'LG',
        'Samsung',
        'Midea',
        'TCL',
        'Hisense',
        'Panasonic',
        'Daikin',
        'Carrier',
        'Gree'
      ],

      capacidades: [
        '9.000 BTU',
        '12.000 BTU',
        '18.000 BTU',
        '24.000 BTU',
        '36.000 BTU'
      ],

      form: this.formVacio(),

      columns: [
        { name: 'equipo', label: 'Equipo', align: 'left' },
        { name: 'cliente', label: 'Cliente / Capacidad', align: 'left' },
        { name: 'acciones', label: 'Acciones', align: 'center' }
      ]
    }
  },

  mounted() {
    this.initData()
  },

  methods: {
    formVacio() {
      return {
        id: null,
        cliente_id: null,
        tipo: '',
        marca: '',
        modelo: '',
        capacidad: ''
      }
    },

    obtenerLista(res) {
      return Array.isArray(res.data) ? res.data : (res.data?.data || [])
    },

    mensajeError(error, defecto) {
      const errores = error.response?.data?.errors
      if (errores) return Object.values(errores).flat()[0]
      return error.response?.data?.message || error.response?.data?.mensaje || defecto
    },

    async initData() {
      this.loading = true

      try {
        const [resEquipos, resClientes] = await Promise.all([
          api.get('/equipos'),
          api.get('/clientes')
        ])

        this.equipos = this.obtenerLista(resEquipos)
        this.clientes = this.obtenerLista(resClientes)
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.mensajeError(error, 'Error al cargar equipos')
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
      if (!this.form.cliente_id) {
        this.$q.notify({
          type: 'warning',
          message: 'Selecciona un cliente'
        })
        return false
      }

      if (!this.form.tipo) {
        this.$q.notify({
          type: 'warning',
          message: 'El tipo de equipo es obligatorio'
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
          cliente_id: this.form.cliente_id,
          tipo: this.form.tipo,
          marca: this.form.marca || null,
          modelo: this.form.modelo || null,
          capacidad: this.form.capacidad || null
        }

        if (this.editando) {
          await api.put(`/equipos/${this.form.id}`, payload)
        } else {
          await api.post('/equipos', payload)
        }

        this.$q.notify({
          type: 'positive',
          message: this.editando ? 'Equipo actualizado' : 'Equipo registrado'
        })

        this.dialog = false
        await this.initData()
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.mensajeError(error, 'Error al guardar equipo')
        })
      } finally {
        this.submitting = false
      }
    },

    editar(row) {
      this.form = {
        id: row.id,
        cliente_id: row.cliente_id,
        tipo: row.tipo || '',
        marca: row.marca || '',
        modelo: row.modelo || '',
        capacidad: row.capacidad || ''
      }

      this.editando = true
      this.dialog = true
    },

    eliminar(id) {
      const equipo = this.equipos.find(e => Number(e.id) === Number(id))

      this.$q.dialog({
        title: 'Eliminar equipo',
        message: '¿Borrar este equipo? Se guardará en historial.',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          if (equipo) {
            const historial = JSON.parse(localStorage.getItem('equipos_eliminados') || '[]')

            historial.unshift({
              ...equipo,
              fecha_eliminacion: new Date().toLocaleString()
            })

            localStorage.setItem('equipos_eliminados', JSON.stringify(historial))
          }

          await api.delete(`/equipos/${id}`)

          this.$q.notify({
            type: 'positive',
            message: 'Equipo eliminado y guardado en historial'
          })

          await this.initData()
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: this.mensajeError(error, 'No se pudo eliminar el equipo')
          })
        }
      })
    }
  }
}
</script>

<style scoped>
.equipos-page {
  min-height: 100vh;
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

.tabla-electrofrio :deep(.q-table tbody tr:hover) {
  background: #eef4ff;
}

.dialog-card {
  width: 460px;
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
  .equipos-page {
    padding: 10px;
  }

  .page-header {
    gap: 12px;
  }

  .btn-page {
    width: 100%;
  }

  .dialog-card {
    width: 95vw;
    max-width: 95vw;
    border-radius: 18px;
  }

  .dialog-scroll {
    max-height: 70vh;
  }

  .form-row-responsive {
    display: flex;
    flex-direction: column;
  }

  .form-row-responsive > div,
  .form-row-responsive .col-6 {
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
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