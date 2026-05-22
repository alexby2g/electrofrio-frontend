<template>
  <q-page class="q-pa-md servicios-page">

    <div class="row justify-between items-center q-mb-md">
      <div>
        <div class="text-h5 text-primary text-weight-bold">
          Servicios
        </div>

        <div class="text-caption text-grey-7">
          Mantenimiento, instalación y reparación de aires acondicionados
        </div>
      </div>

      <q-btn
        class="btn-electrofrio"
        label="Nuevo Servicio"
        icon="add"
        @click="abrirDialog"
      />
    </div>

    <q-card class="filtros-card q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-5">
            <q-input
              v-model="filtro"
              outlined
              dense
              rounded
              clearable
              debounce="300"
              placeholder="Buscar por cliente, técnico, equipo o tipo..."
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
              v-model="filtroTipo"
              :options="opcionesTipo"
              label="Tipo"
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
              icon="build"
              class="q-pa-md chip-total"
            >
              {{ serviciosFiltrados.length }} servicio(s)
            </q-chip>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-table
      class="tabla-electrofrio"
      :rows="serviciosFiltrados"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
      no-data-label="No hay servicios registrados"
      :pagination="pagination"
      :rows-per-page-options="[5, 10, 15, 20, 0]"
    >

      <template #body-cell-orden="props">
        <q-td :props="props">
          <div class="text-weight-bold text-primary">
            #{{ props.row.id }} - {{ props.row.cliente?.nombre || 'S/N' }}
          </div>

          <div class="text-caption text-grey-7">
            {{ textoEquipo(props.row.equipo) }}
          </div>
        </q-td>
      </template>

      <template #body-cell-servicio="props">
        <q-td :props="props">
          <div class="text-weight-bold">
            {{ props.row.tipo_servicio }}
          </div>

          <div class="text-caption text-grey-7">
            Técnico: {{ props.row.tecnico?.nombre || 'S/N' }}
          </div>

          <div class="q-mt-xs">
            <q-badge
              rounded
              color="blue"
              :label="props.row.tipo_servicio || 'Servicio'"
            />
          </div>
        </q-td>
      </template>

      <template #body-cell-fecha_pago="props">
        <q-td :props="props" class="text-center">
          <div>
            {{ props.row.fecha || 'Sin fecha' }}
          </div>

          <div class="text-weight-bold text-green-8">
            {{ Number(props.row.costo || 0).toFixed(2) }} Bs.
          </div>

          <q-badge
            rounded
            :color="colorEstado(props.row.estado)"
            :label="props.row.estado || 'pendiente'"
          />
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
      <q-card class="dialog-card-servicio">
        <q-card-section class="dialog-header row items-center">
          <div class="text-h6">
            {{ editando ? 'Editar Servicio' : 'Nuevo Servicio' }}
          </div>

          <q-space />

          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-scroll-area class="dialog-scroll">
          <q-card-section class="q-gutter-md q-pt-lg">
            <q-select
              v-model="form.cliente_id"
              :options="clientes"
              label="Cliente"
              option-label="nombre"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
              @update:model-value="alCambiarCliente"
            />

            <q-select
              v-model="form.equipo_id"
              :options="equiposFiltrados"
              label="Equipo del cliente"
              :option-label="textoEquipo"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
            />

            <q-select
              v-model="form.tecnico_id"
              :options="tecnicos"
              label="Técnico"
              option-label="nombre"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
            />

            <q-select
              v-model="form.tipo_servicio"
              :options="tiposServicio"
              label="Tipo de servicio"
              option-label="nombre"
              option-value="nombre"
              emit-value
              map-options
              outlined
              dense
              @update:model-value="setPrecio"
            />

            <q-input
              v-model.trim="form.descripcion"
              type="textarea"
              label="Descripción / Observaciones"
              outlined
              dense
            />

            <div class="row q-col-gutter-sm">
              <q-input
                class="col-6"
                v-model="form.fecha"
                type="date"
                label="Fecha"
                outlined
                dense
              />

              <q-input
                class="col-6"
                v-model="form.hora"
                type="time"
                label="Hora"
                outlined
                dense
              />
            </div>

            <div class="row q-col-gutter-sm">
              <q-input
                class="col-6"
                v-model.number="form.costo"
                type="number"
                label="Costo"
                suffix="Bs."
                outlined
                dense
              />

              <q-select
                class="col-6"
                v-model="form.estado"
                :options="['pendiente', 'en proceso', 'finalizado', 'cancelado']"
                label="Estado"
                outlined
                dense
              />
            </div>

            <div class="q-pb-md"></div>
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
  name: 'ServiciosPage',

  data() {
    return {
      loading: false,
      submitting: false,
      servicios: [],
      clientes: [],
      tecnicos: [],
      equipos: [],

      filtro: '',
      filtroEstado: 'todos',
      filtroTipo: 'todos',

      pagination: {
        rowsPerPage: 5
      },

      tiposServicio: [
        { nombre: 'Mantenimiento preventivo', precio_base: 150 },
        { nombre: 'Mantenimiento correctivo', precio_base: 200 },
        { nombre: 'Instalación', precio_base: 350 },
        { nombre: 'Reparación', precio_base: 250 },
        { nombre: 'Carga de gas', precio_base: 180 },
        { nombre: 'Limpieza profunda', precio_base: 120 }
      ],

      dialog: false,
      editando: false,
      form: this.formVacio(),

      columns: [
        { name: 'orden', label: 'Orden / Cliente', align: 'left' },
        { name: 'servicio', label: 'Servicio', align: 'left' },
        { name: 'fecha_pago', label: 'Fecha / Estado', align: 'center' },
        { name: 'acciones', label: 'Acciones', align: 'center' }
      ]
    }
  },

  computed: {
    equiposFiltrados() {
      if (!this.form.cliente_id) return this.equipos

      return this.equipos.filter(
        e => Number(e.cliente_id) === Number(this.form.cliente_id)
      )
    },

    opcionesEstado() {
      return [
        { label: 'Todos', value: 'todos' },
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'En proceso', value: 'en proceso' },
        { label: 'Finalizado', value: 'finalizado' },
        { label: 'Cancelado', value: 'cancelado' }
      ]
    },

    opcionesTipo() {
      return [
        { label: 'Todos', value: 'todos' },
        ...this.tiposServicio.map(tipo => ({
          label: tipo.nombre,
          value: tipo.nombre
        }))
      ]
    },

    serviciosFiltrados() {
      let lista = [...this.servicios]

      if (this.filtro) {
        const texto = this.filtro.toLowerCase()

        lista = lista.filter(servicio => {
          const equipo = this.textoEquipo(servicio.equipo)

          return (
            String(servicio.cliente?.nombre || '').toLowerCase().includes(texto) ||
            String(servicio.tecnico?.nombre || '').toLowerCase().includes(texto) ||
            String(servicio.tipo_servicio || '').toLowerCase().includes(texto) ||
            String(equipo || '').toLowerCase().includes(texto) ||
            String(servicio.estado || '').toLowerCase().includes(texto)
          )
        })
      }

      if (this.filtroEstado !== 'todos') {
        lista = lista.filter(servicio => servicio.estado === this.filtroEstado)
      }

      if (this.filtroTipo !== 'todos') {
        lista = lista.filter(servicio => servicio.tipo_servicio === this.filtroTipo)
      }

      return lista
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
        equipo_id: null,
        tecnico_id: null,
        tipo_servicio: '',
        descripcion: '',
        fecha: new Date().toISOString().slice(0, 10),
        hora: '',
        costo: 0,
        estado: 'pendiente'
      }
    },

    colorEstado(estado) {
      if (estado === 'finalizado') return 'green'
      if (estado === 'en proceso') return 'blue'
      if (estado === 'cancelado') return 'red'
      return 'orange'
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

    textoEquipo(equipo) {
      if (!equipo) return 'S/N'

      return [
        equipo.tipo,
        equipo.marca,
        equipo.modelo,
        equipo.capacidad
      ]
        .filter(Boolean)
        .join(' - ')
    },

    async initData() {
      this.loading = true

      try {
        const [
          resServicios,
          resClientes,
          resTecnicos,
          resEquipos
        ] = await Promise.all([
          api.get('/servicios'),
          api.get('/clientes'),
          api.get('/tecnicos'),
          api.get('/equipos')
        ])

        this.servicios = this.obtenerLista(resServicios)
        this.clientes = this.obtenerLista(resClientes)
        this.tecnicos = this.obtenerLista(resTecnicos)
        this.equipos = this.obtenerLista(resEquipos)
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.mensajeError(
            error,
            'Error al cargar servicios'
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

    alCambiarCliente() {
      this.form.equipo_id = null
    },

    setPrecio(valor) {
      const servicio = this.tiposServicio.find(
        s => s.nombre === valor
      )

      if (servicio) {
        this.form.costo = servicio.precio_base
      }
    },

    validar() {
      if (!this.form.cliente_id) {
        this.$q.notify({
          type: 'warning',
          message: 'Selecciona un cliente'
        })
        return false
      }

      if (!this.form.equipo_id) {
        this.$q.notify({
          type: 'warning',
          message: 'Selecciona un equipo'
        })
        return false
      }

      if (!this.form.tecnico_id) {
        this.$q.notify({
          type: 'warning',
          message: 'Selecciona un técnico'
        })
        return false
      }

      if (!this.form.tipo_servicio) {
        this.$q.notify({
          type: 'warning',
          message: 'Selecciona el tipo de servicio'
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
          ...this.form,
          hora: this.form.hora || null,
          descripcion: this.form.descripcion || null,
          costo: Number(this.form.costo || 0)
        }

        delete payload.id

        if (this.editando) {
          await api.put(`/servicios/${this.form.id}`, payload)
        } else {
          await api.post('/servicios', payload)
        }

        this.$q.notify({
          type: 'positive',
          message: this.editando
            ? 'Servicio actualizado'
            : 'Servicio registrado'
        })

        this.dialog = false

        await this.initData()
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.mensajeError(
            error,
            'Error al guardar servicio'
          )
        })
      } finally {
        this.submitting = false
      }
    },

    editar(row) {
      this.form = {
        id: row.id,
        cliente_id: row.cliente_id,
        equipo_id: row.equipo_id,
        tecnico_id: row.tecnico_id,
        tipo_servicio: row.tipo_servicio || '',
        descripcion: row.descripcion || '',
        fecha: row.fecha || new Date().toISOString().slice(0, 10),
        hora: row.hora || '',
        costo: Number(row.costo || 0),
        estado: row.estado || 'pendiente'
      }

      this.editando = true
      this.dialog = true
    },

    eliminar(id) {
      const servicio = this.servicios.find(
        s => Number(s.id) === Number(id)
      )

      this.$q.dialog({
        title: 'Eliminar servicio',
        message: '¿Eliminar este servicio?',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          if (servicio) {
            const historial = JSON.parse(
              localStorage.getItem('servicios_eliminados') || '[]'
            )

            historial.unshift({
              ...servicio,
              fecha_eliminacion: new Date().toLocaleString()
            })

            localStorage.setItem(
              'servicios_eliminados',
              JSON.stringify(historial)
            )
          }

          await api.delete(`/servicios/${id}`)

          this.$q.notify({
            type: 'positive',
            message: 'Servicio eliminado'
          })

          await this.initData()
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: this.mensajeError(
              error,
              'No se pudo eliminar el servicio'
            )
          })
        }
      })
    }
  }
}
</script>

<style scoped>
.servicios-page {
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
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(13, 71, 161, 0.12);
}

.tabla-electrofrio :deep(.q-table thead tr) {
  background: linear-gradient(135deg, #0d47a1, #c62828);
  color: white;
}

.tabla-electrofrio :deep(.q-table tbody tr:hover) {
  background: #eef4ff;
}

.dialog-card-servicio {
  width: 540px;
  max-width: 95vw;
  max-height: 90vh;
  border-radius: 22px;
  overflow: hidden;
}

.dialog-scroll {
  height: 430px;
  max-height: 60vh;
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
</style>