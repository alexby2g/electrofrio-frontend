<template>
  <q-page class="q-pa-md pagos-page">

    <div class="row justify-between items-center q-mb-lg page-header">
      <div>
        <div class="text-h5 text-primary text-weight-bold">
          Historial de Pagos
        </div>

        <div class="text-caption text-grey-7">
          Seguimiento de cobros por servicios realizados
        </div>
      </div>

      <q-btn
        class="btn-electrofrio btn-page"
        icon="add"
        label="Registrar Pago"
        @click="abrirDialog"
      />
    </div>

    <q-card class="filtros-card q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-center filtros-responsive">
          <div class="col-12 col-md-5">
            <q-input
              v-model="filtro"
              outlined
              dense
              rounded
              clearable
              debounce="300"
              placeholder="Buscar cliente, servicio o método..."
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="filtroEstado"
              :options="opcionesEstado"
              label="Estado"
              outlined
              dense
              rounded
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-2">
            <q-select
              v-model="filtroMetodo"
              :options="opcionesMetodo"
              label="Método"
              outlined
              dense
              rounded
              emit-value
              map-options
            />
          </div>

          <div class="col-12 col-md-2">
            <q-chip
              color="primary"
              text-color="white"
              icon="payments"
              class="q-pa-md chip-total"
            >
              {{ pagosFiltrados.length }} pago(s)
            </q-chip>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-table
      class="tabla-electrofrio"
      :rows="pagosFiltrados"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      no-data-label="No hay pagos registrados"
      :pagination="pagination"
      :rows-per-page-options="[5, 10, 15, 20, 0]"
    >

      <template #body-cell-cliente="props">
        <q-td :props="props">
          <div class="text-weight-bold text-primary">
            {{ props.row.servicio?.cliente?.nombre || 'S/N' }}
          </div>

          <div class="text-caption text-grey-7">
            Servicio #{{ props.row.servicio_id }}
          </div>

          <div class="q-mt-xs">
            <q-badge
              rounded
              color="blue"
              :label="props.row.servicio?.tipo_servicio || 'Servicio'"
            />
          </div>
        </q-td>
      </template>

      <template #body-cell-pago="props">
        <q-td :props="props" class="text-center">
          <div class="text-h6 text-green-8 text-weight-bold">
            {{ Number(props.row.monto || 0).toFixed(2) }} Bs.
          </div>

          <div class="text-caption text-grey-7">
            {{ props.row.metodo_pago || 'Sin método' }}
          </div>

          <q-badge
            rounded
            :color="colorEstado(props.row.estado)"
            :label="props.row.estado || 'Pendiente'"
          />
        </q-td>
      </template>

      <template #body-cell-fecha="props">
        <q-td :props="props" class="text-center">
          <div class="text-weight-bold">
            {{ props.row.fecha_pago || 'Sin fecha' }}
          </div>

          <div class="text-caption text-grey-7">
            Fecha de pago
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
            {{ editando ? 'Editar Pago' : 'Registrar Pago' }}
          </div>

          <q-space />

          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-scroll-area class="dialog-scroll">
          <q-card-section class="q-gutter-md q-pt-lg">
            <q-select
              v-model="form.servicio_id"
              :options="servicios"
              label="Servicio / Orden"
              :option-label="textoServicio"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
              rounded
              @update:model-value="setMontoServicio"
            />

            <q-input
              v-model.number="form.monto"
              type="number"
              label="Monto a Cobrar"
              outlined
              dense
              rounded
              suffix="Bs."
            />

            <q-input
              v-model="form.fecha_pago"
              type="date"
              label="Fecha de Pago"
              outlined
              dense
              rounded
            />

            <q-select
              v-model="form.metodo_pago"
              :options="['Efectivo', 'Transferencia', 'QR', 'Tigo Money']"
              label="Método de Pago"
              outlined
              dense
              rounded
            />

            <q-select
              v-model="form.estado"
              :options="['Completado', 'Pendiente', 'Anulado']"
              label="Estado del Pago"
              outlined
              dense
              rounded
            />

            <q-input
              v-model.trim="form.observaciones"
              type="textarea"
              label="Observaciones"
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
            :label="editando ? 'Actualizar' : 'Confirmar Pago'"
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
  name: 'PagosPage',

  data() {
    return {
      loading: false,
      submitting: false,
      dialog: false,
      editando: false,

      pagos: [],
      servicios: [],

      filtro: '',
      filtroEstado: 'todos',
      filtroMetodo: 'todos',

      pagination: {
        rowsPerPage: 5
      },

      form: this.formVacio(),

      columns: [
        { name: 'cliente', label: 'Cliente / Orden', align: 'left' },
        { name: 'pago', label: 'Pago', align: 'center' },
        { name: 'fecha', label: 'Fecha', align: 'center' },
        { name: 'acciones', label: 'Acciones', align: 'center' }
      ]
    }
  },

  computed: {
    opcionesEstado() {
      return [
        { label: 'Todos', value: 'todos' },
        { label: 'Completado', value: 'Completado' },
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'Anulado', value: 'Anulado' }
      ]
    },

    opcionesMetodo() {
      return [
        { label: 'Todos', value: 'todos' },
        { label: 'Efectivo', value: 'Efectivo' },
        { label: 'Transferencia', value: 'Transferencia' },
        { label: 'QR', value: 'QR' },
        { label: 'Tigo Money', value: 'Tigo Money' }
      ]
    },

    pagosFiltrados() {
      let lista = [...this.pagos]

      if (this.filtro) {
        const texto = this.filtro.toLowerCase()

        lista = lista.filter(pago => {
          return (
            String(pago.servicio?.cliente?.nombre || '').toLowerCase().includes(texto) ||
            String(pago.metodo_pago || '').toLowerCase().includes(texto) ||
            String(pago.estado || '').toLowerCase().includes(texto) ||
            String(pago.servicio?.tipo_servicio || '').toLowerCase().includes(texto)
          )
        })
      }

      if (this.filtroEstado !== 'todos') {
        lista = lista.filter(
          pago => pago.estado === this.filtroEstado
        )
      }

      if (this.filtroMetodo !== 'todos') {
        lista = lista.filter(
          pago => pago.metodo_pago === this.filtroMetodo
        )
      }

      return lista
    }
  },

  mounted() {
    this.initData()
  },

  methods: {
    colorEstado(estado) {
      if (estado === 'Completado') return 'green'
      if (estado === 'Pendiente') return 'orange'
      return 'red'
    },

    formVacio() {
      return {
        id: null,
        servicio_id: null,
        monto: 0,
        fecha_pago: new Date().toISOString().slice(0, 10),
        metodo_pago: 'Efectivo',
        estado: 'Completado',
        observaciones: ''
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

    textoServicio(servicio) {
      if (!servicio) return 'S/N'

      return `Orden #${servicio.id} - ${servicio.cliente?.nombre || 'Sin cliente'} - ${servicio.tipo_servicio || 'Servicio'}`
    },

    async initData() {
      this.loading = true

      try {
        const [resPagos, resServicios] = await Promise.all([
          api.get('/pagos'),
          api.get('/servicios')
        ])

        this.pagos = this.obtenerLista(resPagos)
        this.servicios = this.obtenerLista(resServicios)
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.mensajeError(error, 'Error al cargar pagos')
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

    setMontoServicio(id) {
      const servicio = this.servicios.find(
        s => Number(s.id) === Number(id)
      )

      if (servicio) {
        this.form.monto = Number(servicio.costo || 0)
      }
    },

    validar() {
      if (!this.form.servicio_id) {
        this.$q.notify({
          type: 'warning',
          message: 'Selecciona un servicio'
        })
        return false
      }

      if (Number(this.form.monto) < 0) {
        this.$q.notify({
          type: 'warning',
          message: 'El monto no puede ser negativo'
        })
        return false
      }

      if (!this.form.fecha_pago) {
        this.$q.notify({
          type: 'warning',
          message: 'La fecha de pago es obligatoria'
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
          servicio_id: this.form.servicio_id,
          monto: Number(this.form.monto || 0),
          fecha_pago: this.form.fecha_pago,
          metodo_pago: this.form.metodo_pago || null,
          estado: this.form.estado || null,
          observaciones: this.form.observaciones || null
        }

        if (this.editando) {
          await api.put(`/pagos/${this.form.id}`, payload)
        } else {
          await api.post('/pagos', payload)
        }

        this.$q.notify({
          type: 'positive',
          message: this.editando
            ? 'Pago actualizado'
            : 'Pago registrado'
        })

        this.dialog = false

        await this.initData()
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.mensajeError(error, 'Error al guardar pago')
        })
      } finally {
        this.submitting = false
      }
    },

    editar(row) {
      this.form = {
        id: row.id,
        servicio_id: row.servicio_id,
        monto: Number(row.monto || 0),
        fecha_pago: row.fecha_pago || new Date().toISOString().slice(0, 10),
        metodo_pago: row.metodo_pago || 'Efectivo',
        estado: row.estado || 'Completado',
        observaciones: row.observaciones || ''
      }

      this.editando = true
      this.dialog = true
    },

    eliminar(id) {
      const pago = this.pagos.find(
        p => Number(p.id) === Number(id)
      )

      this.$q.dialog({
        title: 'Eliminar Pago',
        message: '¿Eliminar este registro de pago?',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          if (pago) {
            const historial = JSON.parse(
              localStorage.getItem('pagos_eliminados') || '[]'
            )

            historial.unshift({
              ...pago,
              fecha_eliminacion: new Date().toLocaleString()
            })

            localStorage.setItem(
              'pagos_eliminados',
              JSON.stringify(historial)
            )
          }

          await api.delete(`/pagos/${id}`)

          this.$q.notify({
            type: 'positive',
            message: 'Pago eliminado'
          })

          await this.initData()
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: this.mensajeError(
              error,
              'No se pudo eliminar el pago'
            )
          })
        }
      })
    }
  }
}
</script>

<style scoped>
.pagos-page {
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
  .pagos-page {
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