const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/LoginPage.vue'),
    meta: { publica: true }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('../pages/IndexPage.vue')
      },
      {
        path: 'clientes',
        name: 'clientes',
        component: () => import('../pages/ClientesPage.vue')
      },
      {
        path: 'tecnicos',
        name: 'tecnicos',
        component: () => import('../pages/TecnicosPage.vue')
      },
      {
        path: 'servicios',
        name: 'servicios',
        component: () => import('../pages/ServiciosPage.vue')
      },
      {
        path: 'equipos',
        name: 'equipos',
        component: () => import('../pages/EquiposPage.vue')
      },
      {
        path: 'citas',
        name: 'citas',
        component: () => import('../pages/CitasPage.vue')
      },
      {
        path: 'pagos',
        name: 'pagos',
        component: () => import('../pages/PagosPage.vue')
      },
      {
        path: 'mensajes',
        name: 'mensajes',
        component: () => import('../pages/MensajesPage.vue')
      },
      {
        path: 'configuracion',
        name: 'configuracion',
        component: () => import('../pages/ConfiguracionPage.vue')
      },
      {
        path: 'whatsapp',
        name: 'whatsapp',
        component: () => import('../pages/WhatsAppPage.vue'),
        meta: { roles: ['administrador'] }
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('../pages/UsuariosPage.vue'),
        meta: { roles: ['administrador'] }
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue')
  }
]

export default routes
