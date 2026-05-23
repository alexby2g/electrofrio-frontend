<template>
  <q-page class="q-pa-md tecnicos-page">

    <div class="row justify-between items-center q-mb-md page-header">
      <div>
        <div class="text-h5 text-primary text-weight-bold">
          Técnicos
        </div>

        <div class="text-caption text-grey-7">
          Personal técnico disponible
        </div>
      </div>

      <q-btn
        class="btn-electrofrio btn-page"
        icon="add"
        label="Nuevo Técnico"
        @click="abrirDialog"
      />
    </div>

    <q-table
      class="tabla-electrofrio"
      :rows="tecnicos"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      no-data-label="No hay técnicos registrados"
    >

      <template #body-cell-tecnico="props">
        <q-td :props="props">

          <div class="text-weight-bold text-primary">
            {{ props.row.nombre }}
          </div>

          <div class="text-caption text-grey-7">
            Técnico especializado
          </div>

        </q-td>
      </template>

      <template #body-cell-info="props">
        <q-td :props="props">

          <div>
            🔧 {{ props.row.especialidad || 'Sin especialidad' }}
          </div>

          <div class="text-caption text-grey-7">
            📞 {{ props.row.telefono || 'Sin teléfono' }}
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
            {{ editando ? 'Editar Técnico' : 'Nuevo Técnico' }}
          </div>

          <q-space />

          <q-btn icon="close" flat round dense v-close-popup />

        </q-card-section>

        <q-scroll-area class="dialog-scroll">

          <q-card-section class="q-gutter-md q-pt-lg">

            <q-input
              v-model.trim="form.nombre"
              label="Nombre"
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
              v-model.trim="form.especialidad"
              label="Especialidad"
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
  name: 'TecnicosPage',

  data() {
    return {
      loading: false,
      submitting: false,
      tecnicos: [],
      dialog: false,
      editando: false,

      form: this.formVacio(),

      columns: [
        {
          name: 'tecnico',
          label: 'Técnico',
          align: 'left'
        },

        {
          name: 'info',
          label: 'Información',
          align: 'left'
        },

        {
          name: 'acciones',
          label: 'Acciones',
          align: 'center'
        }
      ]
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
        especialidad: ''
      }
    },

    obtenerLista(res) {
      return Array.isArray(res.data)
        ? res.data
        : (res.data?.data || [])
    },

    mensajeError(error, defecto) {
      const errores = error.response?.data?.errors

      if (errores) {
        return Object.values(errores).flat()[0]
      }

      return (
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        defecto
      )
    },

    async cargar() {
      this.loading = true

      try {
        const res = await api.get('/tecnicos')

        this.tecnicos = this.obtenerLista(res)
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.mensajeError(
            error,
            'Error al cargar técnicos'
          )
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
          message: 'El nombre del técnico es obligatorio'
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
          especialidad: this.form.especialidad || null
        }

        if (this.editando) {
          await api.put(`/tecnicos/${this.form.id}`, payload)
        } else {
          await api.post('/tecnicos', payload)
        }

        this.$q.notify({
          type: 'positive',
          message: this.editando
            ? 'Técnico actualizado'
            : 'Técnico registrado'
        })

        this.dialog = false

        await this.cargar()
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.mensajeError(
            error,
            'Error al guardar técnico'
          )
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
        especialidad: row.especialidad || ''
      }

      this.editando = true
      this.dialog = true
    },

    eliminar(id) {
      const tecnico = this.tecnicos.find(
        t => Number(t.id) === Number(id)
      )

      this.$q.dialog({
        title: 'Confirmar eliminación',
        message: '¿Eliminar este técnico?',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          if (tecnico) {
            const historial = JSON.parse(
              localStorage.getItem('tecnicos_eliminados') || '[]'
            )

            historial.unshift({
              ...tecnico,
              fecha_eliminacion: new Date().toLocaleString()
            })

            localStorage.setItem(
              'tecnicos_eliminados',
              JSON.stringify(historial)
            )
          }

          await api.delete(`/tecnicos/${id}`)

          this.$q.notify({
            type: 'positive',
            message: 'Técnico eliminado'
          })

          await this.cargar()
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: this.mensajeError(
              error,
              'No se pudo eliminar el técnico'
            )
          })
        }
      })
    }
  }
}
</script>

<style scoped>
.tecnicos-page {
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
  .tecnicos-page {
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