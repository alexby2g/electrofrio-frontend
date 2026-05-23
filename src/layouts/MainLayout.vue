<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="header-electrofrio">
      <q-toolbar class="toolbar-electrofrio">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="btn-menu"
          @click="drawer = !drawer"
        />

        <q-avatar class="logo-electrofrio q-mr-sm">
          <img src="../assets/logo-electrofrio.png">
        </q-avatar>

        <q-toolbar-title class="titulo-electrofrio">
          Electro Frío
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      :show-if-above="!$q.screen.lt.md"
      :overlay="$q.screen.lt.md"
      :width="$q.screen.lt.md ? 270 : 295"
      bordered
      class="drawer-electrofrio"
    >
      <q-list padding>
        <q-item-label header class="menu-titulo">
          Sistema de servicios
        </q-item-label>

        <q-item
          v-for="item in menu"
          :key="item.to"
          clickable
          v-ripple
          :to="item.to"
          exact
          class="menu-item"
          active-class="menu-activo"
          @click="cerrarDrawerMovil"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" class="menu-icon" />
          </q-item-section>

          <q-item-section>
            <q-item-label class="menu-label">
              {{ item.label }}
            </q-item-label>

            <q-item-label v-if="item.caption" caption>
              {{ item.caption }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container class="page-electrofrio">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'MainLayout',

  data() {
    return {
      drawer: true,

      menu: [
        { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { to: '/clientes', icon: 'people', label: 'Clientes' },
        { to: '/tecnicos', icon: 'engineering', label: 'Técnicos' },
        { to: '/equipos', icon: 'ac_unit', label: 'Equipos' },
        { to: '/servicios', icon: 'build', label: 'Servicios' },
        { to: '/detalles-tecnicos', icon: 'assignment', label: 'Detalles Técnicos' },
        { to: '/pagos', icon: 'payments', label: 'Pagos', caption: 'Control de ingresos' },
        { to: '/historial', icon: 'history', label: 'Historial', caption: 'Eliminados' }
      ]
    }
  },

  mounted() {
    this.drawer = !this.$q.screen.lt.md
  },

  methods: {
    cerrarDrawerMovil() {
      if (this.$q.screen.lt.md) {
        this.drawer = false
      }
    }
  }
}
</script>

<style scoped>
.header-electrofrio {
  background: linear-gradient(135deg, #0d47a1, #c62828) !important;
}

.toolbar-electrofrio {
  min-height: 72px;
}

.logo-electrofrio {
  width: 52px;
  height: 52px;
  background: white;
  padding: 4px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}

.logo-electrofrio img {
  object-fit: contain;
}

.titulo-electrofrio {
  font-weight: 900;
  font-size: 22px;
  letter-spacing: 0.6px;
}

.btn-menu {
  margin-right: 10px;
}

.drawer-electrofrio {
  background: linear-gradient(180deg, #ffffff, #eef4ff);
}

.menu-titulo {
  color: #0d47a1;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.menu-item {
  margin: 8px 10px;
  border-radius: 18px;
  transition: all 0.25s ease;
}

.menu-item:hover {
  background: #e3f2fd;
  transform: translateX(6px);
}

.menu-icon {
  color: #0d47a1;
}

.menu-label {
  font-weight: 600;
}

.menu-activo {
  background: linear-gradient(135deg, #0d47a1, #c62828) !important;
  color: white !important;
  border-radius: 18px;
  box-shadow: 0 8px 18px rgba(13, 71, 161, 0.28);
}

.menu-activo .q-icon,
.menu-activo .menu-icon,
.menu-activo .menu-label {
  color: white !important;
}

.page-electrofrio {
  background: #f4f7fb;
  min-height: 100vh;
}

/* Responsive móvil */
@media (max-width: 768px) {
  .toolbar-electrofrio {
    min-height: 60px;
    padding: 0 10px;
  }

  .logo-electrofrio {
    width: 42px;
    height: 42px;
  }

  .titulo-electrofrio {
    font-size: 18px;
    letter-spacing: 0.2px;
  }

  .btn-menu {
    margin-right: 4px;
  }

  .menu-item {
    margin: 7px 8px;
    border-radius: 16px;
  }

  .menu-titulo {
    font-size: 12px;
  }
}

@media (max-width: 420px) {
  .titulo-electrofrio {
    font-size: 16px;
  }

  .logo-electrofrio {
    width: 38px;
    height: 38px;
  }
}
</style>