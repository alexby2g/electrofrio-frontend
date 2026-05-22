<template>
  <q-page class="q-pa-md dashboard-page">
    <div class="dashboard-hero q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-white">
          BIEN VENIDO
        </div>
        <div class="text-subtitle2 text-white">
          Panel empresarial de Electro Frío
        </div>
      </div>

      <q-btn
        icon="refresh"
        label="Actualizar"
        class="btn-refresh"
        :loading="loading"
        @click="cargarTotales"
      />
    </div>

    <q-linear-progress v-if="loading" indeterminate color="primary" class="q-mb-md" />

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3" v-for="card in cards" :key="card.titulo">
        <q-card class="stat-card">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">{{ card.titulo }}</div>
                <div class="text-h4 text-weight-bold">{{ card.valor }}</div>
                <div class="text-caption text-positive">{{ card.detalle }}</div>
              </div>

              <q-avatar :class="card.clase" size="54px">
                <q-icon :name="card.icono" size="32px" color="white" />
              </q-avatar>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-8">
        <q-card class="panel-card">
          <q-card-section>
            <div class="text-h6 text-weight-bold text-primary">
              Resumen operativo
            </div>
            <div class="text-caption text-grey-7">
              Comparación visual de los módulos principales
            </div>
          </q-card-section>

          <q-card-section>
            <div v-for="item in progreso" :key="item.label" class="q-mb-md">
              <div class="row justify-between q-mb-xs">
                <div class="text-weight-medium">{{ item.label }}</div>
                <div class="text-grey-7">{{ item.valor }}</div>
              </div>

              <q-linear-progress
                rounded
                size="14px"
                :value="item.porcentaje"
                :color="item.color"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="panel-card">
          <q-card-section>
            <div class="text-h6 text-weight-bold text-primary">
              Estado de servicios
            </div>
            <div class="text-caption text-grey-7">
              Pendientes, en proceso, finalizados y cancelados
            </div>
          </q-card-section>

          <q-card-section>
            <div v-for="estado in estadosServicios" :key="estado.label" class="estado-row">
              <div class="row items-center justify-between">
                <div>
                  <q-badge :color="estado.color" rounded :label="estado.label" />
                </div>
                <div class="text-weight-bold">{{ estado.valor }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-7">
        <q-card class="panel-card">
          <q-card-section>
            <div class="text-h6 text-weight-bold text-primary">
              Últimos servicios
            </div>
            <div class="text-caption text-grey-7">
              Registros recientes del sistema
            </div>
          </q-card-section>

          <q-list separator>
            <q-item v-for="servicio in ultimosServicios" :key="servicio.id">
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" icon="build" />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-bold">
                  {{ servicio.tipo_servicio || 'Servicio' }}
                </q-item-label>
                <q-item-label caption>
                  Cliente: {{ servicio.cliente?.nombre || 'S/N' }} | Técnico:
                  {{ servicio.tecnico?.nombre || 'S/N' }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge
                  rounded
                  :color="colorEstadoServicio(servicio.estado)"
                  :label="servicio.estado || 'pendiente'"
                />
              </q-item-section>
            </q-item>

            <q-item v-if="ultimosServicios.length === 0">
              <q-item-section class="text-grey text-center">
                No hay servicios recientes
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <div class="col-12 col-md-5">
        <q-card class="panel-card">
          <q-card-section>
            <div class="text-h6 text-weight-bold text-primary">
              Ingresos por pagos
            </div>
            <div class="text-caption text-grey-7">
              Total registrado en el módulo de pagos
            </div>
          </q-card-section>

          <q-card-section>
            <div class="ingreso-total">
              {{ totalIngresos.toFixed(2) }} Bs.
            </div>

            <div class="text-caption text-grey-7 q-mb-md">
              Pagos completados: {{ pagosCompletados }}
            </div>

            <q-linear-progress
              rounded
              size="16px"
              color="green"
              :value="porcentajePagosCompletados"
            />

            <div class="q-mt-lg q-gutter-sm">
              <q-btn class="quick-btn" icon="people" label="Clientes" to="/clientes" unelevated />
              <q-btn class="quick-btn" icon="build" label="Servicios" to="/servicios" unelevated />
              <q-btn class="quick-btn" icon="payments" label="Pagos" to="/pagos" unelevated />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { api } from 'boot/axios'

export default {
  name: 'DashboardPage',

  data() {
    return {
      loading: false,
      clientes: [],
      equipos: [],
      servicios: [],
      tecnicos: [],
      pagos: []
    }
  },

  computed: {
    totalClientes() {
      return this.clientes.length
    },

    totalEquipos() {
      return this.equipos.length
    },

    totalServicios() {
      return this.servicios.length
    },

    totalTecnicos() {
      return this.tecnicos.length
    },

    totalIngresos() {
      return this.pagos
        .filter(pago => pago.estado === 'Completado')
        .reduce((total, pago) => total + Number(pago.monto || 0), 0)
    },

    pagosCompletados() {
      return this.pagos.filter(pago => pago.estado === 'Completado').length
    },

    porcentajePagosCompletados() {
      if (this.pagos.length === 0) return 0
      return this.pagosCompletados / this.pagos.length
    },

    cards() {
      return [
        {
          titulo: 'Clientes',
          valor: this.totalClientes,
          icono: 'people',
          clase: 'bg-blue-8',
          detalle: 'Clientes registrados'
        },
        {
          titulo: 'Equipos',
          valor: this.totalEquipos,
          icono: 'ac_unit',
          clase: 'bg-cyan-8',
          detalle: 'Equipos activos'
        },
        {
          titulo: 'Servicios',
          valor: this.totalServicios,
          icono: 'build',
          clase: 'bg-red-8',
          detalle: 'Órdenes creadas'
        },
        {
          titulo: 'Ingresos',
          valor: `${this.totalIngresos.toFixed(0)} Bs.`,
          icono: 'payments',
          clase: 'bg-green-8',
          detalle: 'Pagos completados'
        }
      ]
    },

    maximo() {
      return Math.max(
        this.totalClientes,
        this.totalEquipos,
        this.totalServicios,
        this.totalTecnicos,
        1
      )
    },

    progreso() {
      return [
        {
          label: 'Clientes registrados',
          valor: this.totalClientes,
          porcentaje: this.totalClientes / this.maximo,
          color: 'blue'
        },
        {
          label: 'Equipos registrados',
          valor: this.totalEquipos,
          porcentaje: this.totalEquipos / this.maximo,
          color: 'cyan'
        },
        {
          label: 'Servicios registrados',
          valor: this.totalServicios,
          porcentaje: this.totalServicios / this.maximo,
          color: 'red'
        },
        {
          label: 'Técnicos registrados',
          valor: this.totalTecnicos,
          porcentaje: this.totalTecnicos / this.maximo,
          color: 'purple'
        }
      ]
    },

    estadosServicios() {
      return [
        {
          label: 'Pendiente',
          valor: this.contarEstado('pendiente'),
          color: 'orange'
        },
        {
          label: 'En proceso',
          valor: this.contarEstado('en proceso'),
          color: 'blue'
        },
        {
          label: 'Finalizado',
          valor: this.contarEstado('finalizado'),
          color: 'green'
        },
        {
          label: 'Cancelado',
          valor: this.contarEstado('cancelado'),
          color: 'red'
        }
      ]
    },

    ultimosServicios() {
      return [...this.servicios].slice(-5).reverse()
    }
  },

  mounted() {
    this.cargarTotales()
  },

  methods: {
    obtenerLista(res) {
      return Array.isArray(res.data) ? res.data : (res.data?.data || [])
    },

    contarEstado(estado) {
      return this.servicios.filter(servicio => servicio.estado === estado).length
    },

    colorEstadoServicio(estado) {
      if (estado === 'finalizado') return 'green'
      if (estado === 'en proceso') return 'blue'
      if (estado === 'cancelado') return 'red'
      return 'orange'
    },

    async cargarTotales() {
      this.loading = true

      try {
        const [clientes, equipos, servicios, tecnicos, pagos] = await Promise.all([
          api.get('/clientes'),
          api.get('/equipos'),
          api.get('/servicios'),
          api.get('/tecnicos'),
          api.get('/pagos')
        ])

        this.clientes = this.obtenerLista(clientes)
        this.equipos = this.obtenerLista(equipos)
        this.servicios = this.obtenerLista(servicios)
        this.tecnicos = this.obtenerLista(tecnicos)
        this.pagos = this.obtenerLista(pagos)
      } catch {
        this.$q.notify({
          type: 'negative',
          message: 'No se pudo cargar el dashboard'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
}

.dashboard-hero {
  background: linear-gradient(135deg, #0d47a1, #7b1fa2, #c62828);
  border-radius: 28px;
  padding: 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 16px 40px rgba(13, 71, 161, 0.25);
}

.btn-refresh {
  background: white;
  color: #0d47a1;
  font-weight: 800;
  border-radius: 16px;
}

.stat-card {
  border-radius: 24px;
  box-shadow: 0 14px 35px rgba(13, 71, 161, 0.12);
  transition: all 0.25s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 18px 42px rgba(198, 40, 40, 0.18);
}

.panel-card {
  border-radius: 24px;
  box-shadow: 0 14px 35px rgba(13, 71, 161, 0.12);
  overflow: hidden;
}

.estado-row {
  padding: 12px 0;
  border-bottom: 1px solid #eeeeee;
}

.estado-row:last-child {
  border-bottom: none;
}

.ingreso-total {
  font-size: 34px;
  font-weight: 900;
  color: #2e7d32;
}

.quick-btn {
  width: 100%;
  justify-content: flex-start;
  border-radius: 16px;
  padding: 12px;
  color: white;
  background: linear-gradient(135deg, #0d47a1, #c62828);
  font-weight: 700;
}
</style>