<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="main-header">
      <q-toolbar class="q-px-md main-toolbar">
        <q-btn
          flat
          dense
          round
          icon="menu"
          class="text-white"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="row items-center no-wrap">
          <q-avatar size="42px" class="brand-avatar q-mr-sm">
            <img
              :src="logoElectroFrio"
              alt="Electro Frío"
              class="brand-logo-img"
            />
          </q-avatar>
          <div>
            <div class="text-weight-bold text-h6">Electro Frío</div>
            <div class="text-caption text-blue-1 gt-xs"
              >Sistema de gestión técnica</div
            >
          </div>
        </q-toolbar-title>

        <q-btn
          flat
          round
          icon="notifications_none"
          class="text-white q-mr-sm"
          to="/mensajes"
        >
          <q-badge
            v-if="mensajesNoLeidos"
            floating
            rounded
            color="negative"
            :label="mensajesNoLeidos > 99 ? '99+' : mensajesNoLeidos"
          />
          <q-tooltip>Mensajes pendientes</q-tooltip>
        </q-btn>

        <q-btn-dropdown
          flat
          no-caps
          class="user-menu"
          icon="account_circle"
          :label="nombreUsuario"
        >
          <q-list style="min-width: 330px">
            <q-item>
              <q-item-section avatar
                ><q-icon name="badge" color="primary"
              /></q-item-section>
              <q-item-section>
                <q-item-label>{{ nombreUsuario }}</q-item-label>
                <q-item-label caption>{{ etiquetaRol }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item class="q-py-md">
              <q-item-section>
                <q-item-label class="text-weight-bold">
                  <q-icon name="contrast" color="primary" class="q-mr-xs" />
                  Apariencia
                </q-item-label>
                <q-item-label caption class="q-mb-sm">
                  Cambia la lectura, no la identidad de los módulos.
                </q-item-label>
                <q-btn-toggle
                  v-model="tema"
                  spread
                  no-caps
                  unelevated
                  toggle-color="primary"
                  color="grey-2"
                  text-color="grey-8"
                  :options="temaOptions"
                  @update:model-value="cambiarTema"
                />
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup @click="cerrarSesion">
              <q-item-section avatar
                ><q-icon name="logout" color="negative"
              /></q-item-section>
              <q-item-section>Cerrar sesión</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      class="main-drawer"
      :width="310"
      :mini-width="78"
      :mini="drawerMini && !drawerHovered"
      :breakpoint="1100"
      elevated
      @mouseenter="drawerHovered = true"
      @mouseleave="drawerHovered = false"
    >
      <div class="drawer-header q-pa-md">
        <div class="row items-center no-wrap">
          <q-avatar size="58px" class="brand-avatar q-mr-md">
            <img
              :src="logoElectroFrio"
              alt="Electro Frío"
              class="brand-logo-img"
            />
          </q-avatar>
          <div class="drawer-brand-copy">
            <div class="text-h6 text-weight-bold">Electro Frío</div>
            <div class="text-caption">Control técnico integral</div>
          </div>
        </div>
      </div>

      <q-scroll-area class="drawer-scroll">
        <q-list padding class="drawer-menu">
          <template v-for="group in menuGroups" :key="group.title">
            <q-item-label header class="menu-section-title">{{
              group.title
            }}</q-item-label>
            <q-item
              v-for="item in group.items"
              :key="item.to"
              clickable
              v-ripple
              :to="item.to"
              :exact="item.exact"
              active-class="menu-active"
              class="drawer-menu-item"
            >
              <q-item-section avatar>
                <div class="menu-icon-wrap">
                  <q-icon :name="item.icon" />
                  <span class="menu-step">{{ item.step }}</span>
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
                <q-item-label v-if="item.caption" caption>{{
                  item.caption
                }}</q-item-label>
              </q-item-section>
              <q-item-section v-if="item.badge" side>
                <q-badge rounded color="negative" :label="item.badge" />
              </q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-scroll-area>

      <div class="drawer-relationship">
        <q-icon name="hub" size="20px" />
        <div>
          <strong>Flujo conectado</strong>
          <span>Cliente y equipo → Atención → Seguimiento → Entrega</span>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import api from '../services/api.js'
import { limpiarSesion, obtenerUsuario } from '../services/auth.js'
import { aplicarTema, obtenerTema } from '../services/theme.js'
import logoElectroFrio from '../assets/electrofrio-mark.png'

const router = useRouter()
const $q = useQuasar()
const leftDrawerOpen = ref(false)
const drawerMini = ref(false)
const drawerHovered = ref(false)
const usuario = ref(obtenerUsuario())
const mensajesNoLeidos = ref(0)
const tema = ref(obtenerTema())
let temporizadorMensajes = null

const temaOptions = [
  { label: 'Claro', value: 'claro', icon: 'light_mode' },
  { label: 'Oscuro', value: 'oscuro', icon: 'dark_mode' },
  { label: 'Daltónico', value: 'daltonico', icon: 'accessibility_new' }
]

const nombreUsuario = computed(() => usuario.value?.name || 'Usuario')
const etiquetaRol = computed(() => {
  const roles = {
    administrador: 'Administrador',
    recepcion: 'Recepción',
    tecnico: 'Técnico'
  }

  return roles[usuario.value?.rol] || 'Usuario autorizado'
})

const menuGroups = computed(() => [
  {
    title: 'Gestión diaria',
    items: [
      {
        label: 'Panel de control',
        caption: 'Indicadores y accesos rápidos',
        icon: 'space_dashboard',
        to: '/',
        exact: true,
        step: '01'
      },
      {
        label: 'Clientes',
        caption: 'Clientes, equipos e historial',
        icon: 'groups',
        to: '/clientes',
        step: '02'
      },
      {
        label: 'Atenciones',
        caption: 'Agenda, trabajo y cobro',
        icon: 'event_available',
        to: '/citas',
        step: '03'
      },
      {
        label: 'Mensajes',
        caption: 'Comunicación y seguimiento',
        icon: 'forum',
        to: '/mensajes',
        step: '04',
        badge: mensajesNoLeidos.value || null
      },
      {
        label: 'Configuración',
        caption: 'Servicios, personal e integraciones',
        icon: 'tune',
        to: '/configuracion',
        step: '05'
      }
    ]
  }
])

onMounted(() => {
  cargarMensajesNoLeidos()
  temporizadorMensajes = window.setInterval(cargarMensajesNoLeidos, 10000)
})

onUnmounted(() => {
  if (temporizadorMensajes) window.clearInterval(temporizadorMensajes)
})

const cargarMensajesNoLeidos = async () => {
  try {
    const { data } = await api.get('/mensajes/no-leidos')
    mensajesNoLeidos.value = Number(data.total || 0)
  } catch {
    // Mantiene el último contador visible durante cortes de red.
  }
}

const toggleLeftDrawer = () => {
  if ($q.screen.gt.md) {
    drawerMini.value = !drawerMini.value
    return
  }

  leftDrawerOpen.value = !leftDrawerOpen.value
}

const cambiarTema = nuevoTema => {
  tema.value = aplicarTema(nuevoTema)
}

const cerrarSesion = async () => {
  try {
    await api.post('/auth/logout')
  } catch {
    // La sesión local se limpia aunque Laravel no esté disponible.
  } finally {
    limpiarSesion()
    await router.replace({ name: 'login' })
  }
}
</script>
