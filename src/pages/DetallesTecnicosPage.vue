<template>
  <q-page class="q-pa-md detalles-page">
    <div class="row justify-between items-center q-mb-lg">
      <div>
        <div class="text-h5 text-primary text-weight-bold">
          Detalles Técnicos
        </div>
        <div class="text-caption text-grey-7">
          Ficha técnica de cada equipo
        </div>
      </div>

      <q-btn
        class="btn-electrofrio"
        icon="add"
        label="Nuevo Registro"
        @click="abrirDialog"
      />
    </div>

    <q-table
      class="tabla-electrofrio"
      :rows="detalles"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      no-data-label="No hay detalles técnicos registrados"
    >
      <template #body-cell-equipo="props">
        <q-td :props="props">
          <div class="text-weight-bold text-primary">
            {{ textoEquipo(props.row.equipo) }}
          </div>
          <div class="text-caption text-grey-7">
            Ficha técnica registrada
          </div>
        </q-td>
      </template>

      <template #body-cell-datos="props">
        <q-td :props="props">
          <div>⚡ Voltaje: {{ props.row.voltaje || 'S/N' }}</div>
          <div class="text-caption text-grey-7">
            ❄ Gas: {{ props.row.gas_refrigerante || 'S/N' }}
          </div>
          <div class="text-caption text-grey-7">
            🔌 Amp: {{ props.row.amperaje_nominal || 'S/N' }}
          </div>
        </q-td>
      </template>

      <template #body-cell-presiones="props">
        <q-td :props="props" class="text-center">
          <div class="text-weight-bold">
            Succión: {{ props.row.presion_succion_psi || 'S/N' }} PSI
          </div>
          <div class="text-caption text-grey-7">
            Descarga: {{ props.row.presion_descarga_psi || 'S/N' }} PSI
          </div>
        </q-td>
      </template>

      <template #body-cell-acciones="props">
        <q-td :props="props" class="q-gutter-xs text-center">
          <q-btn size="sm" round unelevated color="primary" icon="edit" @click="editar(props.row)" />
          <q-btn size="sm" round unelevated color="negative" icon="delete" @click="eliminar(props.row.id)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialog" persistent>
      <q-card class="dialog-card">
        <q-card-section class="dialog-header row items-center">
          <div class="text-h6">
            {{ editando ? 'Editar Ficha Técnica' : 'Nueva Ficha Técnica' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-gutter-md q-pt-lg">
          <q-select
            v-model="form.equipo_id"
            :options="equipos"
            label="Equipo"
            :option-label="textoEquipo"
            option-value="id"
            emit-value
            map-options
            outlined
            dense
            rounded
          />

          <div class="row q-col-gutter-sm">
            <q-input
              class="col-6"
              v-model.trim="form.gas_refrigerante"
              label="Gas Refrigerante"
              placeholder="R410A"
              outlined
              dense
              rounded
            />

            <q-select
              class="col-6"
              v-model="form.voltaje"
              :options="['110V', '220V', '380V']"
              label="Voltaje"
              outlined
              dense
              rounded
            />
          </div>

          <div class="row q-col-gutter-sm">
            <q-input class="col-4" v-model.number="form.amperaje_nominal" type="number" label="Amperaje" outlined dense rounded />
            <q-input class="col-4" v-model.number="form.presion_succion_psi" type="number" label="PSI Succión" outlined dense rounded />
            <q-input class="col-4" v-model.number="form.presion_descarga_psi" type="number" label="PSI Descarga" outlined dense rounded />
          </div>

          <q-input
            v-model.trim="form.observaciones_tecnicas"
            type="textarea"
            label="Observaciones Técnicas"
            outlined
            dense
            rounded
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn class="btn-electrofrio" :label="editando ? 'Actualizar' : 'Guardar'" @click="guardar" :loading="submitting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { api } from 'boot/axios'

export default {
  name: 'DetallesTecnicosPage',

  data() {
    return {
      loading: false,
      submitting: false,
      dialog: false,
      editando: false,
      detalles: [],
      equipos: [],
      form: this.formVacio(),

      columns: [
        { name: 'equipo', label: 'Equipo', align: 'left' },
        { name: 'datos', label: 'Datos Técnicos', align: 'left' },
        { name: 'presiones', label: 'Presiones', align: 'center' },
        { name: 'acciones', label: 'Acciones', align: 'center' }
      ]
    }
  },

  mounted() {
    this.cargarDatos()
  },

  methods: {
    formVacio() {
      return {
        id: null,
        equipo_id: null,
        gas_refrigerante: 'R410A',
        voltaje: '220V',
        amperaje_nominal: null,
        presion_succion_psi: null,
        presion_descarga_psi: null,
        observaciones_tecnicas: ''
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

    textoEquipo(equipo) {
      if (!equipo) return 'S/N'
      return [equipo.tipo, equipo.marca, equipo.modelo, equipo.capacidad].filter(Boolean).join(' - ')
    },

    async cargarDatos() {
      this.loading = true
      try {
        const [resDet, resEq] = await Promise.all([
          api.get('/detalles-tecnicos'),
          api.get('/equipos')
        ])

        this.detalles = this.obtenerLista(resDet)
        this.equipos = this.obtenerLista(resEq)
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.mensajeError(error, 'Error al cargar detalles técnicos')
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
      if (!this.form.equipo_id) {
        this.$q.notify({ type: 'warning', message: 'Selecciona un equipo' })
        return false
      }

      return true
    },

    async guardar() {
      if (!this.validar()) return

      this.submitting = true

      try {
        const payload = {
          equipo_id: this.form.equipo_id,
          gas_refrigerante: this.form.gas_refrigerante ? this.form.gas_refrigerante.toUpperCase() : null,
          voltaje: this.form.voltaje ? this.form.voltaje.toUpperCase() : null,
          amperaje_nominal: this.form.amperaje_nominal,
          presion_succion_psi: this.form.presion_succion_psi,
          presion_descarga_psi: this.form.presion_descarga_psi,
          observaciones_tecnicas: this.form.observaciones_tecnicas || null
        }

        if (this.editando) {
          await api.put(`/detalles-tecnicos/${this.form.id}`, payload)
        } else {
          await api.post('/detalles-tecnicos', payload)
        }

        this.$q.notify({
          type: 'positive',
          message: this.editando ? 'Ficha actualizada' : 'Ficha guardada'
        })

        this.dialog = false
        await this.cargarDatos()
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.mensajeError(error, 'Error al guardar ficha técnica')
        })
      } finally {
        this.submitting = false
      }
    },

    editar(row) {
      this.form = {
        id: row.id,
        equipo_id: row.equipo_id,
        gas_refrigerante: row.gas_refrigerante || '',
        voltaje: row.voltaje || '',
        amperaje_nominal: row.amperaje_nominal,
        presion_succion_psi: row.presion_succion_psi,
        presion_descarga_psi: row.presion_descarga_psi,
        observaciones_tecnicas: row.observaciones_tecnicas || ''
      }

      this.editando = true
      this.dialog = true
    },

    eliminar(id) {
      const detalle = this.detalles.find(d => Number(d.id) === Number(id))

      this.$q.dialog({
        title: 'Confirmar eliminación',
        message: '¿Eliminar esta ficha técnica? Se guardará en historial.',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          if (detalle) {
            const historial = JSON.parse(localStorage.getItem('detalles_tecnicos_eliminados') || '[]')

            historial.unshift({
              ...detalle,
              fecha_eliminacion: new Date().toLocaleString()
            })

            localStorage.setItem('detalles_tecnicos_eliminados', JSON.stringify(historial))
          }

          await api.delete(`/detalles-tecnicos/${id}`)

          this.$q.notify({
            type: 'positive',
            message: 'Ficha eliminada y guardada en historial'
          })

          await this.cargarDatos()
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: this.mensajeError(error, 'No se pudo eliminar la ficha')
          })
        }
      })
    }
  }
}
</script>

<style scoped>
.detalles-page {
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
  min-width: 520px;
  border-radius: 22px;
  overflow: hidden;
}

.dialog-header {
  background: linear-gradient(135deg, #0d47a1, #c62828);
  color: white;
}
</style>