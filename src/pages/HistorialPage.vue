<template>
  <q-page class="historial-page">
    <q-scroll-area class="historial-scroll">
      <div class="q-pa-md historial-content">

        <div class="row justify-between items-center q-mb-lg page-header">
          <div>
            <div class="text-h4 text-weight-bold text-primary titulo-historial">
              Historial
            </div>

            <div class="text-caption text-grey-7">
              Registros eliminados con opción de restaurar
            </div>
          </div>

          <q-btn
            class="btn-electrofrio btn-page"
            icon="delete_sweep"
            label="Limpiar historial"
            @click="limpiarHistorial"
          />
        </div>

        <div class="row q-col-gutter-md">
          <div
            class="col-12 col-md-4"
            v-for="grupo in grupos"
            :key="grupo.key"
          >
            <q-card class="historial-card">
              <q-card-section class="card-head">
                <q-icon :name="grupo.icon" size="28px" />

                <div>
                  <div class="text-h6">
                    {{ grupo.titulo }}
                  </div>

                  <div class="text-caption">
                    {{ grupo.items.length }} registro(s)
                  </div>
                </div>
              </q-card-section>

              <q-list separator>
                <q-item
                  v-for="(item, index) in grupo.items"
                  :key="`${grupo.key}-${index}`"
                >
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-primary">
                      {{ tituloItem(grupo.key, item) }}
                    </q-item-label>

                    <q-item-label caption>
                      {{ detalleItem(grupo.key, item) }}
                    </q-item-label>

                    <q-item-label caption>
                      Eliminado: {{ item.fecha_eliminacion }}
                    </q-item-label>

                    <div class="q-mt-sm row q-gutter-sm acciones-historial">
                      <q-btn
                        size="sm"
                        icon="restore"
                        label="Restaurar"
                        color="positive"
                        unelevated
                        rounded
                        :loading="restaurando"
                        @click="restaurar(grupo.key, item, index)"
                      />

                      <q-btn
                        size="sm"
                        icon="delete_forever"
                        label="Quitar"
                        color="negative"
                        flat
                        rounded
                        @click="quitarDelHistorial(grupo.key, index)"
                      />
                    </div>
                  </q-item-section>
                </q-item>

                <q-item v-if="grupo.items.length === 0">
                  <q-item-section class="text-grey text-center empty-item">
                    Sin registros
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
        </div>

      </div>
    </q-scroll-area>
  </q-page>
</template>

<script>
import { api } from 'boot/axios'

export default {
  name: 'HistorialPage',

  data() {
    return {
      restaurando: false,
      clientesEliminados: [],
      tecnicosEliminados: [],
      equiposEliminados: [],
      serviciosEliminados: [],
      pagosEliminados: [],
      detallesTecnicosEliminados: []
    }
  },

  computed: {
    grupos() {
      return [
        { key: 'clientes', titulo: 'Clientes', icon: 'person_off', items: this.clientesEliminados },
        { key: 'tecnicos', titulo: 'Técnicos', icon: 'engineering', items: this.tecnicosEliminados },
        { key: 'equipos', titulo: 'Equipos', icon: 'ac_unit', items: this.equiposEliminados },
        { key: 'servicios', titulo: 'Servicios', icon: 'event_busy', items: this.serviciosEliminados },
        { key: 'pagos', titulo: 'Pagos', icon: 'money_off', items: this.pagosEliminados },
        { key: 'detalles', titulo: 'Fichas técnicas', icon: 'assignment_late', items: this.detallesTecnicosEliminados }
      ]
    }
  },

  mounted() {
    this.cargarHistorial()
  },

  methods: {
    cargarHistorial() {
      this.clientesEliminados = JSON.parse(localStorage.getItem('clientes_eliminados') || '[]')
      this.tecnicosEliminados = JSON.parse(localStorage.getItem('tecnicos_eliminados') || '[]')
      this.equiposEliminados = JSON.parse(localStorage.getItem('equipos_eliminados') || '[]')
      this.serviciosEliminados = JSON.parse(localStorage.getItem('servicios_eliminados') || '[]')
      this.pagosEliminados = JSON.parse(localStorage.getItem('pagos_eliminados') || '[]')
      this.detallesTecnicosEliminados = JSON.parse(localStorage.getItem('detalles_tecnicos_eliminados') || '[]')
    },

    guardarHistorial(key, lista) {
      const mapa = {
        clientes: 'clientes_eliminados',
        tecnicos: 'tecnicos_eliminados',
        equipos: 'equipos_eliminados',
        servicios: 'servicios_eliminados',
        pagos: 'pagos_eliminados',
        detalles: 'detalles_tecnicos_eliminados'
      }

      localStorage.setItem(mapa[key], JSON.stringify(lista))
      this.cargarHistorial()
    },

    tituloItem(key, item) {
      if (key === 'clientes') return item.nombre || 'Cliente'
      if (key === 'tecnicos') return item.nombre || 'Técnico'
      if (key === 'equipos') return this.textoEquipo(item)
      if (key === 'servicios') return item.tipo_servicio || 'Servicio'
      if (key === 'pagos') return `${Number(item.monto || 0).toFixed(2)} Bs.`
      if (key === 'detalles') return this.textoEquipo(item.equipo)
      return 'Registro'
    },

    detalleItem(key, item) {
      if (key === 'clientes') {
        return `Tel: ${item.telefono || 'S/N'} | Dirección: ${item.direccion || 'S/N'}`
      }

      if (key === 'tecnicos') {
        return `Tel: ${item.telefono || 'S/N'} | Especialidad: ${item.especialidad || 'S/N'}`
      }

      if (key === 'equipos') {
        return `Cliente: ${item.cliente?.nombre || 'S/N'} | Capacidad: ${item.capacidad || 'S/N'}`
      }

      if (key === 'servicios') {
        return `Cliente: ${item.cliente?.nombre || 'S/N'} | Fecha: ${item.fecha || 'S/N'} | Estado: ${item.estado || 'S/N'}`
      }

      if (key === 'pagos') {
        return `Método: ${item.metodo_pago || 'S/N'} | Estado: ${item.estado || 'S/N'}`
      }

      if (key === 'detalles') {
        return `Gas: ${item.gas_refrigerante || 'S/N'} | Voltaje: ${item.voltaje || 'S/N'}`
      }

      return ''
    },

    textoEquipo(equipo) {
      if (!equipo) return 'Equipo S/N'

      return [
        equipo.tipo,
        equipo.marca,
        equipo.modelo,
        equipo.capacidad
      ].filter(Boolean).join(' - ')
    },

    limpiarPayload(key, item) {
      const copiar = { ...item }

      delete copiar.id
      delete copiar.created_at
      delete copiar.updated_at
      delete copiar.deleted_at
      delete copiar.fecha_eliminacion
      delete copiar.cliente
      delete copiar.tecnico
      delete copiar.equipo
      delete copiar.servicio

      if (key === 'servicios') {
        copiar.hora = copiar.hora || null
        copiar.descripcion = copiar.descripcion || null
        copiar.costo = Number(copiar.costo || 0)
      }

      if (key === 'pagos') {
        copiar.monto = Number(copiar.monto || 0)
        copiar.observaciones = copiar.observaciones || null
      }

      return copiar
    },

    endpoint(key) {
      const rutas = {
        clientes: '/clientes',
        tecnicos: '/tecnicos',
        equipos: '/equipos',
        servicios: '/servicios',
        pagos: '/pagos',
        detalles: '/detalles-tecnicos'
      }

      return rutas[key]
    },

    listaPorKey(key) {
      const listas = {
        clientes: this.clientesEliminados,
        tecnicos: this.tecnicosEliminados,
        equipos: this.equiposEliminados,
        servicios: this.serviciosEliminados,
        pagos: this.pagosEliminados,
        detalles: this.detallesTecnicosEliminados
      }

      return listas[key]
    },

    restaurar(key, item, index) {
      this.$q.dialog({
        title: 'Restaurar registro',
        message: '¿Deseas restaurar este registro al sistema?',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        this.restaurando = true

        try {
          const payload = this.limpiarPayload(key, item)

          await api.post(this.endpoint(key), payload)

          const lista = [...this.listaPorKey(key)]
          lista.splice(index, 1)

          this.guardarHistorial(key, lista)

          this.$q.notify({
            type: 'positive',
            message: 'Registro restaurado correctamente'
          })
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'No se pudo restaurar el registro'
          })
        } finally {
          this.restaurando = false
        }
      })
    },

    quitarDelHistorial(key, index) {
      this.$q.dialog({
        title: 'Quitar del historial',
        message: '¿Deseas quitar este registro solo del historial?',
        cancel: true,
        persistent: true
      }).onOk(() => {
        const lista = [...this.listaPorKey(key)]
        lista.splice(index, 1)
        this.guardarHistorial(key, lista)

        this.$q.notify({
          type: 'positive',
          message: 'Registro quitado del historial'
        })
      })
    },

    limpiarHistorial() {
      this.$q.dialog({
        title: 'Limpiar historial',
        message: '¿Seguro que deseas borrar todo el historial?',
        cancel: true,
        persistent: true
      }).onOk(() => {
        localStorage.removeItem('clientes_eliminados')
        localStorage.removeItem('tecnicos_eliminados')
        localStorage.removeItem('equipos_eliminados')
        localStorage.removeItem('servicios_eliminados')
        localStorage.removeItem('pagos_eliminados')
        localStorage.removeItem('detalles_tecnicos_eliminados')

        this.cargarHistorial()

        this.$q.notify({
          type: 'positive',
          message: 'Historial limpiado'
        })
      })
    }
  }
}
</script>

<style scoped>
.historial-page {
  background: linear-gradient(135deg, #eef4ff, #fff5f5);
  height: calc(100vh - 72px);
}

.historial-scroll {
  height: 100%;
  width: 100%;
  padding-bottom: 50px;
}

.historial-card {
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 14px 35px rgba(13, 71, 161, 0.14);
  background: white;
}

.card-head {
  background: linear-gradient(135deg, #0d47a1, #c62828);
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-item {
  min-height: 80px;
  display: flex;
  justify-content: center;
}

@media (max-width: 600px) {
  .historial-page {
    height: calc(100vh - 60px);
  }

  .historial-content {
    padding: 10px;
  }

  .page-header {
    gap: 12px;
  }

  .titulo-historial {
    font-size: 26px;
  }

  .btn-page {
    width: 100%;
  }

  .historial-card {
    border-radius: 18px;
  }

  .card-head {
    padding: 14px;
  }

  .acciones-historial {
    display: flex;
    flex-direction: column;
  }

  .acciones-historial .q-btn {
    width: 100%;
  }
}
</style>